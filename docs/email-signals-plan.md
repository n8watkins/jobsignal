# Email Signals — build plan

How the Gmail scan works and, more importantly, what we can build **around** it
before the Google OAuth setup is done. The actual Google fetch is a thin top
layer; almost everything else is pure logic or DB work we can build and verify
now.

## The flow, end to end

```
open Applications ──► query builder ──► Gmail messages.list (q)   ┐
   (company, applied date)                                        │ OAuth
recruiter emails ──┘                     Gmail messages.get       │ layer
label setting ─────────────────────────► (format=metadata)       ┘
                                              │
                                              ▼
                          classify (sender/subject/snippet)   ← already built + tested
                                              │
                                              ▼
                          match email → Application (by company name + recruiter email)
                                              │
                                              ▼
                  upsert EmailEvent (dedup on gmailMessageId)
                                              │
                          ┌───────────────────┼────────────────────┐
                          ▼                   ▼                     ▼
                 high confidence       low confidence         job-alert noise
                 apply status change   → Review queue          → drop
                 + ApplicationEvent     (confirm / correct)
                                              │
                                              ▼
                 store historyId  → next scan uses history.list (cheap incremental)
```

## What's buildable NOW (no OAuth) — the foundation

These are pure functions or DB logic. All verifiable today; they're what the
scan calls. Building them first means OAuth day is just wiring an adapter.

1. **Connection/state model** (Prisma + migration) — `GmailConnection`
   { userId, refreshToken, tokenExpiry, historyId, labelFilter, connectedEmail,
   lastScanAt }. Stores the token + incremental-sync cursor + label setting.
2. **Query builder** (pure, unit-tested) — from open applications (+ label +
   per-application applied date) produce Gmail `q` strings, chunked under the
   query-length limit. This is the heart of the application-anchored scan.
3. **Email → application matcher** (pure, unit-tested) — given sender / subject /
   snippet, match to a tracked application by normalized company name and any
   captured recruiter email. Reuses `normalizeText` from the apps flow.
4. **Classify → persist → reconcile** service (DB) — classify (done) → upsert
   `EmailEvent` (dedup on `gmailMessageId`) → link the application → apply the
   status transition (`rejection`→rejected, `interview_request`→interview, …) +
   write an `ApplicationEvent`; route low-confidence to the Review queue.
5. **Inbox / Review / dashboard** read real `EmailEvent` rows instead of mock
   data; wire **confirm / correct / archive** to update `reviewStatus` /
   classification (and apply the corrected status). Shows empty until a scan
   runs — which is fine.
6. **Settings → Gmail card** — connection status, label-filter input, and a
   (dormant) Connect button. The label setting persists now.

## What needs OAuth — the thin top layer

Build these once credentials are in `.env` (see [gmail-setup.md](./gmail-setup.md)):

7. **Gmail client adapter** — token refresh, `messages.list(q)`,
   `messages.get(metadata)`, `history.list`. With throttle (stay under
   250 units/sec ≈ 50 gets/sec) and 429 exponential backoff.
8. **OAuth routes** — `/api/gmail/oauth/start` (redirect to Google) and
   `/api/gmail/oauth/callback` (exchange code → store refresh token).
9. **Scan orchestrator** — ties query builder → adapter → reconcile service,
   stores the new `historyId`. The orchestrator's logic is testable now with a
   mocked client; only the live fetch needs OAuth.

## Later (V3)

- **Scheduling** — on-demand "Scan Gmail" button first; a cron/scheduled scan
  later.
- **Cold / unmatched recruiting mail → sourcing.** Out of scope now (see
  [[email-scan-design]]): recruiter emails + LinkedIn position notifications
  would feed the sourcing / Job Radar pipeline (`CandidateJob`) for evaluation
  instead of being dropped.

## Build order

Phase 1 (now, OAuth-free, fully verifiable): **1 → 2 → 3 → 4 → 5 → 6**.
Phase 2 (after OAuth creds): **7 → 8 → 9**, then verify against the real inbox.
Phase 3 (later): scheduling, then the V3 sourcing hook.
