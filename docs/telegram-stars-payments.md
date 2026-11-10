# Telegram Stars shop payments

The shop offers signed-in Telegram Stars checkout through @FSFESbot with fixed per-product prices. The live deployment uses the Cloud Run setup below.

**Current deployment route:** the billing account's project-link quota has been reached. Use [the Cloud Run setup in the existing billed project fan-site-496610](telegram-stars-cloud-run.md), keeping Auth, Firestore, and Hosting in gta-vi-fan-site. The same-project instructions below remain an alternative; they require billing on the website project and are not the current route.

## What is included

- USDT/Telegram Stars method selection in the shop and header cart.
- Firebase-authenticated order creation, status, purchase history, and download authorization.
- 84 fixed prices in `functions/shop-stars-catalog.json`, initially 100 Stars per $1 of each current displayed price. For example, $2.60 becomes 260 Stars. Prices are snapshots, not runtime exchange rates; later USD price changes do not change existing Stars prices or orders.
- A 30-minute order handoff to the existing @FSFESbot, linked to the initiating website account. The first verified Telegram payer binds the order; another payer cannot use it.
- Pre-checkout validation with a six-second application deadline, followed by delivery only after a verified successful payment. Atomic charge records prevent duplicate grants.
- Private purchase history, browser-session recovery, refunds, and operator reconciliation for missed notifications.
- `/paysupport ORDER_NUMBER description` tickets for the order's Telegram payer, with operator replies through the bot.
- Account export and deletion handling. Active checkouts/refunds must finish or expire first. Deletion removes the website account association from retained payment evidence; delayed payments for a deleted account are refunded.

## Your setup steps

### 0. Reuse the existing billing account

I checked the project metadata on 2026-11-08: `fan-site-496610` has billing enabled; `gta-vi-fan-site` has no billing account linked. `fan-site-496610` is not currently enabled for Firebase according to the Firebase Management API.

Linking `gta-vi-fan-site` to the same active Cloud Billing account would keep one deployment project, but the user confirmed that the account's project-link quota prevents this. Use the Cloud Run setup linked above; it uses the already billed project directly. [Google Cloud billing documentation](https://docs.cloud.google.com/billing/docs/how-to/modify-project).

The live service uses `fan-site-496610` for compute and secrets, with a dedicated runtime identity authorized to access Auth and Firestore in `gta-vi-fan-site`. The alternative commands below target the website project and require billing there.

### 1. Store the existing bot token securely

In Telegram, open @BotFather, choose @FSFESbot under /mybots, and obtain its API token. Keep that same token for the existing storage integration. Paste it only into this CLI prompt, never into chat or a source file:

~~~sh
firebase functions:secrets:set TELEGRAM_STARS_BOT_TOKEN --project gta-vi-fan-site
~~~

Create an independent webhook secret without displaying its value:

~~~sh
node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))' | firebase functions:secrets:set TELEGRAM_STARS_WEBHOOK_SECRET --data-file - --project gta-vi-fan-site
~~~

The Stars function uses its own Secret Manager entry for the same bot credential. The existing Cloudflare Telegram storage configuration does not need to change.

### 2. Check existing bot update routing

~~~sh
npm run stars:bot -- --project gta-vi-fan-site --check
~~~

This verifies the token's bot identity and inspects its webhook without changing it. The setup script refuses to replace a different existing webhook. If another application consumes this bot's updates using `getUpdates`, stop or integrate that consumer before enabling the webhook. Sending storage files through the Bot API can continue alongside a payment webhook. [Telegram webhook API](https://core.telegram.org/bots/api#setwebhook).

### 3. Enable the backend configuration

Add or update only these non-secret values in ignored `functions/.env`, preserving its other settings:

~~~dotenv
TELEGRAM_STARS_BOT_USERNAME=FSFESbot
TELEGRAM_STARS_ENABLED=true
TELEGRAM_STARS_TEST_MODE=false
~~~

Setting `TELEGRAM_STARS_ENABLED=false` disables new invoices and approvals after redeployment. Already completed payments and refunds continue to be recorded; paid customers retain download access.

### 4. Deploy the implementation

~~~sh
npm run lint
npm run test:stars:coverage
npm run build
firebase deploy --only functions:shopStarsApi,functions:telegramStarsWebhook,functions:accountManagement,firestore:rules,firestore:indexes,hosting --project gta-vi-fan-site
~~~

Deploy `accountManagement` too: its export/deletion flow now understands Stars records. Wait for the new Firestore history index to finish building before launch. Existing unrelated functions do not need redeployment for this feature.

### 5. Register the payment webhook

After deployment and the read-only check:

~~~sh
npm run stars:bot -- --project gta-vi-fan-site --configure
~~~

The script registers `https://leonidaloot.com/api/telegram/stars/webhook` with its secret header, retains pending updates, and adds /paysupport while preserving existing default bot commands. It does not send messages or make purchases.

Make one controlled low-value purchase from a signed-in website account, confirm delivery and profile history, and exercise an operator refund before general launch. Telegram offers a separate test environment; use a separate staging project/test bot for that, rather than changing the production storage bot's environment. [Stars payments guide](https://core.telegram.org/bots/payments-stars).

For withdrawing earnings, verify the bot owner's Fragment eligibility and current terms. Reward value differs from the customer's Stars purchase cost, and received Stars may remain unavailable for up to 21 days. [Telegram developer terms](https://telegram.org/tos/bot-developers).

## API contract

All account endpoints require a Firebase ID token in `Authorization: Bearer …`; the backend checks revocation. Telegram webhook requests use the independent `X-Telegram-Bot-Api-Secret-Token` header. Tokens and raw payment details are never logged.

| Method and path | Purpose |
| --- | --- |
| `GET /api/shop/stars/config` | Public availability, bot username, test-mode flag, and fixed price table. |
| `POST /api/shop/stars/orders` | Body: productIds and a unique requestId. The backend ignores client amounts and derives ownership from authentication. |
| `GET /api/shop/stars/orders?after=ORDER_ID` | Owner's history, 20 orders per page with nextCursor. |
| `GET /api/shop/stars/orders/ORDER_ID` | Owner's status and resumable payment handoff. |
| `POST /api/shop/stars/orders/ORDER_ID/download` | Body: productId. Returns the purchased file link only for a paid, non-refunded order. |
| `POST /api/telegram/stars/webhook` | Trusted bot handoff, pre-checkout, payment, refund, and support updates. |
| `POST /api/shop/stars/orders/ORDER_ID/refund` | Operator only. Refunds the payer and revokes order downloads. |
| `POST /api/shop/stars/reconcile` | Operator only. Body: offset, initially 0. Replays up to 100 verified Telegram ledger entries; repeat using nextOffset until null. |
| `GET /api/shop/stars/support` | Operator only. Latest 50 payment-support tickets. |
| `POST /api/shop/stars/support/TICKET_ID/reply` | Operator only. Body: text, 3–2000 characters. Sends one reply through the bot. |

Operator endpoints require the existing Firebase custom claim `admin: true`. Keep operator ID tokens out of source files, command history, and chat. Refund calls remain retryable after provider/network failures; access stays suspended while a refund is pending. The Telegram transaction ledger is the recovery source for missed updates. [Bot payment/refund/transaction API](https://core.telegram.org/bots/api#getstartransactions).

## Data and payment invariants

- `shopStarsOrders` holds immutable product/price/file snapshots, the website owner, bound payer, handoff hash, approval lease, charge reference, and lifecycle timestamps.
- `shopStarsCharges` prevents one Telegram charge from granting multiple orders. Payment transitions are pending → paid → refund_pending → refunded; expired is a derived display state for unpaid orders. A delayed valid success is still recorded after the invoice's display expiry.
- `shopStarsReview` retains mismatched or unexpected payment evidence for operator investigation. Do not delete or treat those records as paid entitlements.
- `shopStarsSupport` stores private order support requests and operator replies.
- `shopStarsAccounts` serializes account deletion against new orders and payment approvals. `shopStarsRateLimits` caps new order creation at 10 per account per 10 minutes; idempotent retries do not consume another slot.
- All six collections deny direct client reads and writes. Authenticated API responses omit Telegram payer IDs, charge IDs, handoff hashes, and file URLs until authorized delivery.
- P2P seller payouts and their TRON settlement flow remain separate from Stars shop orders.

## Existing file-delivery limitation

Stars authorizes delivery on the server, but the existing originals are shared Google Drive files and their URLs still appear in the legacy USDT product catalog. This implementation does not turn those files into a private storage paywall, and revoking Stars access cannot revoke a Drive link already obtained. Migrating paid originals to private storage and migrating legacy USDT delivery requires a separate coordinated change. Do not describe the current files as protected from direct-link sharing.

## Maintenance and verification

~~~sh
npm run stars:catalog
npm run stars:catalog -- --write
npm run test:stars:coverage
npm run test:stars:rules
npm run test:stars:browser
npm run lint
npm run build
~~~

Catalog refreshes preserve existing priceStars values. Review explicit price edits in `functions/shop-stars-catalog.json`, then redeploy the Stars functions. Existing orders retain their original snapshot.

The browser test uses installed Chrome and `playwright-core`, with an isolated local API and mocked Telegram calls. If Playwright is supplied outside the repository, set PLAYWRIGHT_MODULE_PATH to its index.mjs. No real payment, message, or external file access occurs. The emulator tests use demo-leonida-stars, never the production database.

A real bot/payment smoke test remains required after merchant setup; local tests cannot verify unavailable bot credentials, its current webhook, Fragment eligibility, or live Telegram delivery.
