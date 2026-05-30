# JobSignal Extension

Chrome Manifest V3 extension for the JobSignal job application tracker.

## Dev setup

```bash
# From the monorepo root
pnpm install
pnpm extension:build
```

The built files land in `apps/extension/dist/`.

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right)
3. Click **Load unpacked**
4. Select `apps/extension/dist`

## Windows build workflow

The repo lives in WSL but Chrome runs on Windows. After each build, copy the
dist folder to Windows so Chrome can load it:

```bash
# Run from WSL after pnpm extension:build
cp -r /home/natkins/projects/jobsignal-starter/jobsignal/apps/extension/dist \
      /mnt/c/Users/natha/Projects/Extensions/jobsignal-extension/dist
```

Then in Chrome: go to `chrome://extensions`, find JobSignal Capture, and click
the refresh icon to reload the updated extension.

## Extension settings

Open the extension popup → settings tab:

- **API Base**: `http://localhost:3002` (or wherever the web app runs)
- **Shared Secret**: must match `EXTENSION_SHARED_SECRET` in `apps/web/.env.local`

## Mark Applied keyboard shortcut

Default: **Ctrl+Shift+A** (Windows/Linux) / **Cmd+Shift+A** (Mac)

Customize at `chrome://extensions/shortcuts`.
