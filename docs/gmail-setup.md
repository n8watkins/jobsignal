# Gmail Setup (one-time)

JobSignal's email scan reads replies from companies you've applied to and turns
them into pipeline updates. It uses the Gmail API with the **read-only** scope —
it can read and search mail, but cannot send, delete, or modify anything.

This is a one-time Google Cloud setup, ~10 minutes. Use your job-search Google
account (the inbox where recruiter/ATS mail lands).

## 1. Create / pick a project

1. Go to <https://console.cloud.google.com>.
2. Project dropdown (top bar) → **New Project** → name it `jobsignal` → **Create**.
3. Make sure the new project is selected.

## 2. Enable the Gmail API

1. **APIs & Services → Library**.
2. Search **"Gmail API"** → open it → **Enable**.

## 3. Configure the OAuth consent screen

1. **APIs & Services → OAuth consent screen**.
2. **User type: External** → **Create**.
3. Required fields: **App name** `JobSignal`, **User support email** (yours),
   **Developer contact email** (yours). Logo/domains can stay blank.
4. **Scopes** → **Add or remove scopes** → add manually:

   ```
   https://www.googleapis.com/auth/gmail.readonly
   ```

   It will be flagged "restricted" — that's expected. Save.
5. **Test users** → **Add users** → add your own email. Save.

### Publishing status — pick one

| Choice | Setup | Trade-off |
| --- | --- | --- |
| **Testing** (default) | Just add yourself as a test user | ⚠️ With a restricted scope the login **expires every 7 days** — you re-click "Connect Gmail" ~weekly |
| **Production** (recommended) | Click **Publish app** | One-time **"Google hasn't verified this app"** warning on connect → **Advanced → Go to JobSignal (unsafe)**. Safe for your own app; the login then **persists** |

## 4. Create the OAuth client credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. **Application type: Web application**, name `JobSignal Web`.
3. **Authorized redirect URIs → Add URI** — add both (covers the 3001 fallback port):

   ```
   http://localhost:3000/api/gmail/oauth/callback
   http://localhost:3001/api/gmail/oauth/callback
   ```

4. **Create** → copy the **Client ID** and **Client secret**.

## 5. Add the values to `apps/web/.env`

These keys already exist (empty) — fill them in:

```
GOOGLE_CLIENT_ID=<client id>
GOOGLE_CLIENT_SECRET=<client secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/oauth/callback
```

Run the dev server on a fixed port so the redirect URI always matches:

```
pnpm --filter web dev -p 3000
```

## Done

Open **Settings → Gmail → Connect Gmail**, approve the consent screen, and the
scan can start. See [email-signals-plan.md](./email-signals-plan.md) for how the
scan works and what's built around it.
