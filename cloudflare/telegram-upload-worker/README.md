# Cloudflare Telegram Storage Worker

This Worker backs the GTA VI Hub P2P and community post upload flows. It keeps the Telegram bot token server-side, verifies the Firebase ID token sent by the web app, and forwards files to Telegram Bot API. It also streams public image/video attachments after verifying that the requested file belongs to a public Firestore post.

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
VITE_TELEGRAM_FILE_ENDPOINT=https://<worker-subdomain>.workers.dev/api/telegram/file
```

The hosted Telegram Bot API has a much smaller upload ceiling than a local Bot API server. Cloudflare Workers are a good secure proxy for regular bundles, but they are not the right runtime for multi-gigabyte uploads.
