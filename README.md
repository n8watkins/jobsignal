# JobSignal Starter

JobSignal is a personal AI-powered job application tracker. V1 is built around one core action:

> **Mark Applied = capture job + create application + store JD + queue AI analysis + add timeline event.**

This starter repo gives you the web app, Prisma schema, API route skeletons, AI service stubs, and Chrome extension scaffold needed to start building.

## What is included

- `apps/web` — Next.js app router dashboard, application pages, API route skeletons, Prisma schema, mock data.
- `apps/extension` — Chrome Manifest V3 extension scaffold with Mark Applied flow, LinkedIn extractor, generic extractor, and API client.
- `packages/shared` — shared Zod schemas, enums, and TypeScript types.
- `docs/PRD.md` — V1 product requirements.

## What is intentionally stubbed

- Real Google OAuth/Gmail token flow.
- Real Gmail API scan/archive calls.
- Real AI provider call.
- Production auth.
- Production duplicate matching.
- LinkedIn selector hardening against layout changes.

Those pieces need credentials and real browser testing.

## Quick start

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000/dashboard`.

## Extension dev flow

```bash
pnpm extension:build
```

Then in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click **Load unpacked**.
4. Select `apps/extension/dist` after building.

## Suggested build order

1. Manual application creation.
2. Paste JD + analysis.
3. Application detail timeline.
4. Extension Mark Applied.
5. Gmail scan/classification.
6. Confirm rejection + archive.

## Security notes

- Do not request Gmail send/delete permissions for V1.
- Archive only after explicit user confirmation.
- Encrypt tokens before storing in production.
- Keep single-user access restricted while this is personal beta.
