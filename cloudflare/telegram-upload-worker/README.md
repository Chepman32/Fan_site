# Cloudflare Telegram Upload Worker

This Worker backs the GTA VI Hub P2P listing upload flow. It keeps the Telegram bot token server-side, verifies the Firebase ID token sent by the web app, and forwards listing files to Telegram Bot API.

Required Cloudflare secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_STORAGE_CHAT_ID`

Required Worker variables:

- `FIREBASE_PROJECT_ID`
- `ALLOWED_ORIGIN`
- `TELEGRAM_API_BASE_URL`
- `TELEGRAM_MAX_UPLOAD_BYTES`

After deployment, set the web app env var:

```sh
VITE_TELEGRAM_UPLOAD_ENDPOINT=https://<worker-subdomain>.workers.dev/api/telegram/upload
```

The hosted Telegram Bot API has a much smaller upload ceiling than a local Bot API server. Cloudflare Workers are a good secure proxy for regular bundles, but they are not the right runtime for multi-gigabyte uploads.
