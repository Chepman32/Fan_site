# AGENTS.md

This file is the working manual for agents and developers operating in this repository. It is intentionally detailed: the project mixes a public React site, Firebase-backed social features, a shop checkout, P2P listings, Telegram-backed file storage, and an automatic USDT TRC20 payout flow that moves real funds.

Read this before making changes. In payment, auth, Firestore rules, Firebase Functions, or deployment areas, treat this document as required context.

## Project Summary

This repository is a Vite + React application for a GTA VI fan/community site. The app includes:

- A public landing/home experience with game information, media, characters, map/location content, and news.
- A social layer with profiles, posts, rumors, sources, polls, comments, reactions, and direct messages.
- A shop flow for downloadable products paid in USDT on TRON.
- A P2P marketplace where users can list digital goods/services, upload files, message each other, and settle crypto purchases.
- Firebase Hosting, Firestore, Firebase Auth, Firebase Analytics, and Firebase Functions.
- A Firebase Function that verifies buyer USDT payments and automatically pays sellers minus a platform commission.
- A Telegram storage bridge for P2P listing files and public community post media without exposing the bot token in the browser.

The production Firebase project currently used by the repository is:

```txt
gta-vi-fan-site
```

The known platform/payment wallet address used in the project is:

```txt
TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei
```

This address appears in frontend configuration and backend function defaults. The automatic payout function requires the private key for this exact address to be stored as a Firebase Secret Manager secret. Never commit that key or paste it into source files.

## High-Level Architecture

The app has three major runtime surfaces:

1. Browser client
   - React app built by Vite.
   - Uses Firebase client SDK for Auth, Firestore, and Analytics.
   - Handles UI, routing, listing creation, checkout display, TronLink payments, and authenticated API calls.

2. Firebase backend
   - Firestore stores social content, users, messages, P2P listings, and backend-created P2P deal records.
   - Firebase Rules protect client-writable collections.
   - Firebase Functions expose server-side API endpoints for Telegram uploads and P2P automatic payout settlement.
   - Firebase Secret Manager stores the payout wallet private key.

3. External blockchain and storage services
   - TRON/TRONGrid is used for USDT TRC20 transfer discovery and seller payouts.
   - TronLink can be used in the browser for user-initiated USDT transfers.
   - Telegram Bot API is used as a listing file storage backend through a server-side proxy.
   - A Cloudflare Worker may also be used for Telegram uploads depending on environment configuration.

## Repository Map

Important root files:

- `package.json`
  - Root frontend package scripts and dependencies.
- `vite.config.js`
  - Vite configuration and local dev proxy behavior.
- `firebase.json`
  - Firebase Hosting, Functions, Firestore rule/index deployment config.
- `firestore.rules`
  - Firestore security rules for all client-accessible collections.
- `firestore.indexes.json`
  - Firestore indexes.
- `.env.example`
  - Browser/Vite environment variable template.
- `.gitignore`
  - Ignores local env files and generated artifacts.
- `README.md`
  - User-facing project setup notes.
- `AGENTS.md`
  - This file.

Frontend source:

- `src/main.jsx`
  - React entry point.
- `src/App.jsx`
  - Top-level app composition, routing, header/cart state, page rendering.
- `src/firebase/firebaseClient.js`
  - Lazy Firebase client initialization and exported Firebase SDK helpers.
- `src/social/SocialContext.jsx`
  - Auth, Firestore subscriptions, social data merge, mutations, shop purchase records, P2P listing mutations, messaging.
- `src/shop/shopData.js`
  - Shop product data, platform payment constants, USDT/TRON constants, formatting helpers.
- `src/shop/tronPayments.js`
  - Browser-side TRON/USDT utilities for TronLink payments and transaction verification.
- `src/p2p/p2pData.js`
  - P2P listing seed data, categories, payment methods, and formatting helpers.
- `src/p2p/p2pPayouts.js`
  - Authenticated browser client for the automatic payout function.
- `src/p2p/telegramStorage.js`
  - Compatibility re-export for the shared Telegram storage client.
- `src/storage/telegramStorage.js`
  - Authenticated Telegram upload client and public post-media URL builder.
- `src/components/PostMediaAttachments.jsx`
  - Renders Telegram-backed image/video attachments for public community posts.
- `src/components/CryptoCheckoutPanel.jsx`
  - Standard shop checkout panel.
- `src/components/P2PTradingPage.jsx`
  - Main P2P marketplace UI, listing form, details modal, and P2P USDT checkout box.

Firebase Functions:

- `functions/package.json`
  - Functions package manifest.
- `functions/index.cjs`
  - All Firebase Function implementations.
- `functions/.env.example`
  - Functions environment variable template.
- `functions/.env`
  - Local non-secret Functions env values. This is ignored by git.

Cloudflare worker:

- `cloudflare/telegram-upload-worker/`
  - Optional/legacy Telegram upload worker implementation.
  - The frontend default example currently points to a Cloudflare Worker endpoint, while Firebase Hosting also rewrites `/api/telegram/upload` to the Firebase Function.

## Tech Stack

Frontend:

- React 19.
- Vite 8.
- JavaScript/JSX.
- CSS modules/global CSS as already organized in the repo.
- `firebase` client SDK.
- `tronweb` for TRON interactions.
- `qrcode` for payment QR generation.
- `framer-motion` for animation.
- `lucide-react` for icons.

Backend:

- Firebase Functions v2.
- Node.js 20 runtime.
- CommonJS in `functions/index.cjs`.
- `firebase-admin` for Auth verification and Firestore Admin SDK.
- `firebase-functions` for v2 HTTPS functions.
- `tronweb` for server-side USDT transfers.
- `busboy` for multipart file upload parsing.

Infrastructure:

- Firebase Hosting serves the Vite `dist` build.
- Firebase Hosting rewrites API routes to Firebase Functions.
- Firestore stores app data.
- Firebase Auth identifies users.
- Firebase Analytics logs page views where available.
- Firebase Secret Manager stores `P2P_PAYOUT_PRIVATE_KEY`.

## Important Commands

Run frontend development server:

```sh
npm run dev
```

Lint:

```sh
npm run lint
```

Build:

```sh
npm run build
```

Preview built site:

```sh
npm run preview
```

Check the Functions file for syntax:

```sh
node --check functions/index.cjs
```

Install/update Functions dependencies after changing `functions/package.json`:

```sh
cd functions
npm install
```

Deploy the P2P payout function:

```sh
firebase deploy --only functions:p2pUsdtPayout --project gta-vi-fan-site --force
```

Deploy payout function, Firestore rules, and Hosting:

```sh
firebase deploy --only functions:p2pUsdtPayout,firestore:rules,hosting --project gta-vi-fan-site --force
```

Deploy Firestore rules only:

```sh
firebase deploy --only firestore:rules --project gta-vi-fan-site
```

Set the payout private key secret:

```sh
firebase functions:secrets:set P2P_PAYOUT_PRIVATE_KEY --project gta-vi-fan-site
```

Do not put the secret value into `.env.example`, `.env`, source code, chat, screenshots, docs, or commit history.

## Firebase Hosting And Rewrites

Firebase Hosting is configured in `firebase.json`.

The configured public directory is:

```txt
dist
```

Important rewrites:

```txt
/api/telegram/upload -> telegramUpload function in us-central1
/api/telegram/file   -> telegramFile function in us-central1
/api/p2p/payout     -> p2pUsdtPayout function in us-central1
/**                 -> /index.html
```

The catch-all rewrite supports the React single-page app routes.

The P2P payout frontend defaults to:

```txt
/api/p2p/payout
```

That means production Hosting can call the function through the same domain without exposing the raw Cloud Run URL.

## Environment Variables

### Browser/Vite Env

Browser-visible values are defined through `VITE_` variables. They are not secrets.

Template: `.env.example`

Known variables:

```txt
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_GOOGLE_TRANSLATE_API_KEY=
VITE_TELEGRAM_UPLOAD_ENDPOINT=https://gta-vi-p2p-telegram-upload.antonkerch555.workers.dev/api/telegram/upload
VITE_TELEGRAM_FILE_ENDPOINT=https://gta-vi-p2p-telegram-upload.antonkerch555.workers.dev/api/telegram/file
VITE_P2P_PAYOUT_ENDPOINT=/api/p2p/payout
VITE_P2P_PLATFORM_USDT_ADDRESS=TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei
VITE_P2P_COMMISSION_RATE=0.02
```

Notes:

- Every `VITE_` variable is bundled into the frontend if referenced.
- Do not put private keys, service account JSON, bot tokens, or admin credentials in `VITE_` variables.
- `VITE_P2P_PLATFORM_USDT_ADDRESS` is public and safe to expose.
- `VITE_P2P_COMMISSION_RATE` is public display/config for the client. The backend must always independently calculate commission.

### Firebase Functions Env

Template: `functions/.env.example`

Known variables:

```txt
TELEGRAM_BOT_TOKEN=
TELEGRAM_STORAGE_CHAT_ID=
TELEGRAM_API_BASE_URL=https://api.telegram.org
TELEGRAM_MAX_UPLOAD_BYTES=52428800
P2P_PLATFORM_USDT_ADDRESS=TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei
P2P_PAYOUT_PRIVATE_KEY=
P2P_COMMISSION_RATE=0.02
TRONGRID_API_KEY=
TRONGRID_FULL_HOST=https://api.trongrid.io
```

Important:

- `functions/.env` is ignored by git.
- `P2P_PAYOUT_PRIVATE_KEY` should be a Firebase Secret Manager secret, not a committed env file value.
- `TRONGRID_API_KEY` is optional but recommended for production reliability/rate limits.
- `TELEGRAM_BOT_TOKEN` must never be exposed to the browser.

The local `functions/.env` may contain non-secret defaults such as:

```txt
P2P_PLATFORM_USDT_ADDRESS=TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei
P2P_COMMISSION_RATE=0.02
TRONGRID_FULL_HOST=https://api.trongrid.io
```

## Git And Secret Safety

Never commit:

- Private keys.
- Wallet seed phrases.
- Keystore JSON files.
- Firebase service account JSON.
- Telegram bot tokens.
- TRONGrid API keys.
- Raw production `.env` files.
- Screenshots showing secrets.

The user may already have uncommitted work. Do not revert unrelated changes. Before large edits, inspect `git status` and relevant diffs.

## Application Routing

The app uses lightweight client-side routing in `src/App.jsx`, not a full router package.

Known routes:

- `/`
  - Landing/home sections.
- `/community`
  - Social/community view.
- `/profile`
  - Current user profile.
- `/profile/:id`
  - Public profile for a user.
- `/shop`
  - Shop products and cart checkout.
- `/p2p`
  - P2P marketplace.
- `/messages`
  - Direct messages.
- `/locations/:slug`
  - Location details.

Navigation is handled through browser history and route parsing helpers in `App.jsx`.

When adding a new route:

1. Add route parsing/rendering in `App.jsx`.
2. Update the header/navigation behavior if it should be user-visible.
3. Confirm Hosting catch-all rewrite still supports it.
4. Confirm direct page refresh works after build/preview or on Hosting.

## SEO And Public Crawling

The production public origin used for SEO metadata is:

```txt
https://leonidaloot.com
```

Technical SEO is handled in a few places:

- `index.html`
  - Contains the fallback title, description, canonical URL, robots tag, Open Graph/Twitter card tags, Google-compatible favicon links, font preconnects, base JSON-LD, and the SEO head replacement markers used by prerendering.
- `src/seo/seoConfig.js`
  - Defines route-specific SEO metadata for `/`, `/community`, `/shop`, `/p2p`, `/profile`, `/profile/:id`, `/messages`, and `/locations/:slug`.
  - Defines canonical URLs, robots behavior, Open Graph/Twitter PNG image defaults, breadcrumbs, sitemap routes, prerender routes, noindex prerender routes, and JSON-LD graph data.
  - Keep new route metadata here when adding routes.
- `src/seo/SeoHead.jsx`
  - Updates `document.title`, description, robots, canonical, Open Graph/Twitter tags, JSON-LD, and the `<html lang>` value on route/language changes.
- `src/entry-server.jsx`
  - Server-side/prerender entry used by `vite build --ssr`.
  - Renders `<App initialRoute="...">` with static route components so generated HTML includes the route content, one H1 on public pages, and route-specific SEO before JavaScript runs.
- `scripts/prerender.mjs`
  - Runs after the client and SSR builds.
  - Generates raw route HTML for `/`, `/community`, `/shop`, `/p2p`, known `/locations/:slug` pages, and noindex HTML for `/profile` and `/messages`.
  - Writes both `route/index.html` files and matching `route.html` aliases so Firebase clean URLs and local Vite preview can serve slashless route HTML.
  - Regenerates `dist/sitemap.xml` and `dist/robots.txt` from the shared SEO config.
- `scripts/seo-validate.mjs`
  - Validates generated raw HTML, canonical format, PNG OG/Twitter image usage, JSON-LD parseability, sitemap membership, robots sitemap reference, noindex pages, Google-compatible favicon assets, and exactly one H1 on public prerendered pages.
- `public/robots.txt`
  - Allows public crawling, blocks API/reserved Firebase paths, and points crawlers to the sitemap.
- `public/sitemap.xml`
  - Lists indexable static routes and known Leonida location guides.
  - It intentionally omits auth-only pages, private messages, and dynamic user profile pages.
- `public/og-image.png`
  - Default crawler-compatible `1200x630` social preview image used by Open Graph, Twitter card tags, and JSON-LD image references.
- `public/og-image.svg`
  - Optional source/design asset only. Do not use SVG as the primary Open Graph image because some social platforms do not reliably render SVG previews.
- `public/favicon.ico`, `public/favicon-48x48.png`, `public/favicon-96x96.png`, `public/favicon.png`
  - Google/Search-compatible favicon assets generated from the legacy brand icon. Keep these square, crawlable, and stable; Google recommends favicon sizes that are multiples of 48px.
- `public/favicon.svg`
  - Optional scalable favicon fallback/source asset. Do not rely on SVG alone for Google Search favicons.
- `public/apple-touch-icon.png`
  - 180x180 touch icon for Apple and mobile surfaces.

Build and validation commands:

```sh
npm run build
npm run seo:validate
```

`npm run build` runs the Vite client build, Vite SSR build, static prerender, and SEO validation. Firebase Hosting should serve generated route HTML from `dist` before the SPA catch-all; `firebase.json` sets `cleanUrls: true` and `trailingSlash: false` so canonical public URLs stay slashless except `/`.

SEO limitations:

- Static public routes now have route-specific raw HTML metadata from build-time prerendering, so social unfurlers and lightweight crawlers can see title, description, canonical, Open Graph/Twitter tags, and JSON-LD before JavaScript runs.
- Dynamic Firestore-backed content such as user profiles, community posts, messages, and P2P listings is not statically represented in the sitemap.
- `/profile` and `/messages` get generated noindex HTML and remain out of the sitemap; public `/profile/:id` pages get client-side profile metadata when user data is available, but are still not prerendered or listed in the sitemap.
- True route-specific raw SEO for Firestore/user-generated pages requires SSR with data fetching, SSG from a trusted content source, or edge/server metadata rendering.

## Top-Level React Composition

`src/main.jsx` mounts the app.

`src/App.jsx` wraps the app in:

```jsx
<LanguageProvider>
  <SocialProvider>
    <AppContent />
  </SocialProvider>
</LanguageProvider>
```

`AppContent` owns:

- Current route state.
- Navigation helpers.
- Shop cart state.
- Header props.
- Auth modal open/close state.
- Page selection.
- Landing page sections.

`Header` receives shared app state including:

- Current user.
- Auth modal open handler.
- Logout handler.
- Navigation handler.
- Cart items.
- Cart totals.
- Cart item removal handler.

## Firebase Client Initialization

File: `src/firebase/firebaseClient.js`

The client initializes Firebase lazily. It tries browser/Vite env configuration first. If env values are absent, it fetches Firebase Hosting reserved config from:

```txt
/__/firebase/init.json
```

This supports production Hosting and local development with the configured dev proxy.

`getFirebaseServices()` returns:

- `auth`
- `db`
- Auth helpers such as sign-in/sign-out methods.
- Firestore helpers such as `collection`, `doc`, `addDoc`, `setDoc`, `updateDoc`, `runTransaction`, `serverTimestamp`, etc.

Analytics page views are logged through `logAnalyticsPageView`.

Guidelines:

- Prefer `getFirebaseServices()` over importing and initializing Firebase repeatedly.
- Keep Firebase client code browser-safe.
- Do not import Admin SDK into frontend files.
- If adding Firestore operations, verify both SocialContext data flow and Firestore rules.

## Social Context

File: `src/social/SocialContext.jsx`

This is the main state/data orchestration layer for user-facing social features.

Responsibilities:

- Firebase Auth session tracking.
- User profile document creation/maintenance.
- Firestore subscriptions.
- Merging seed/static data with Firestore documents.
- Social mutations for posts, comments, rumors, sources, polls, reactions.
- Shop purchase recording.
- P2P listing creation/update/status/delete.
- Direct messages.

Subscribed collections include:

- `users`
- `posts`
- `rumors`
- `sources`
- `polls`
- `comments`
- `p2pListings`
- `messages` for authenticated users where `participantIds` contains the current uid.

Important pattern:

- Seed data and Firestore data are merged by id.
- Firestore data should override seed data where ids overlap.
- Client writes must match Firestore rules exactly.

When adding a new Firestore-backed feature:

1. Add client state/subscription logic in SocialContext or a focused module.
2. Add/modify Firestore rules.
3. Add Firestore indexes if queries require them.
4. Verify auth and ownership logic.
5. Build and test both signed-out and signed-in flows.

## Firestore Collections

### `users`

Stores public user/profile data.

Security model:

- Public read.
- User can create/update their own document.
- Updates are restricted to allowed fields.
- Deletes are not allowed from client.

### `posts`

Stores community posts.

Posts can contain up to four Telegram-backed image/video attachments. Each attachment is limited to 20 MiB so the hosted Telegram Bot API can stream it back through `getFile`.

Security model:

- Public read.
- Signed-in users can create their own posts.
- Limited reaction-only updates are allowed.
- Authors can delete their posts.

### `rumors`

Stores rumor entries.

Security model:

- Public read.
- Signed-in authors can create.
- Updates are limited by author/field rules.

### `sources`

Stores source/news/community references.

Security model:

- Public read.
- Signed-in creation with validation.
- Restricted updates.

### `polls`

Stores poll definitions and votes.

Security model:

- Public read.
- Signed-in interactions.
- Vote/update shape is restricted.

### `comments`

Stores comments tied to content.

Security model:

- Public read.
- Signed-in author create.
- Restricted updates/deletes.

### `messages`

Stores direct messages.

Security model:

- Only participants should be able to read relevant messages.
- Signed-in users can send messages where they are valid participants.
- Client delete is not generally supported.

### `p2pListings`

Stores marketplace listings.

Security model:

- Public read.
- Signed-in seller can create listing with `sellerId` equal to their uid.
- Seller can update allowed fields.
- `sellerId` and `createdAt` are immutable after create.
- Seller or admin can delete.
- Allowed fields are limited to listing shape.

Allowed listing concepts:

- Seller id.
- Title.
- Description.
- Category.
- Price.
- Currency.
- Crypto wallet address.
- Delivery method.
- Payment methods.
- Properties.
- Preview data URL.
- Files.
- Status.
- Created/updated timestamps.

Constraints:

- Payment methods are currently `crypto` and/or `card`.
- File count max is 8.
- Status is `active` or `sold`.
- Properties count is limited.

### `p2pDeals`

Stores backend-created P2P settlement records.

Security model:

- Client can read only if buyer, seller, or admin.
- Client cannot create/update/delete.
- Firebase Admin SDK in the payout function writes this collection.

Important:

- Do not add client writes to `p2pDeals`.
- Deal documents are part of payout idempotency and audit trail.

## Firestore Rules

File: `firestore.rules`

Rules include helpers such as:

- `signedIn`
- `owns`
- `isAdmin`
- `changedOnly`
- shape validation helpers

General rule principles:

- Public content can often be read publicly.
- Writes require authentication.
- Ownership fields must match `request.auth.uid`.
- Client updates should be field-limited.
- Backend-only records should deny client writes.

When editing rules:

1. Keep rules and frontend payload shapes in sync.
2. Avoid broad `allow write: if signedIn()` patterns.
3. Avoid allowing clients to edit settlement, commission, payout, or audit fields.
4. Deploy rules before relying on a new client write shape in production.
5. Consider using emulator tests for rule changes when possible.

## Shop Data And Standard Checkout

Primary files:

- `src/shop/shopData.js`
- `src/shop/tronPayments.js`
- `src/components/CryptoCheckoutPanel.jsx`

The standard shop checkout is different from the P2P automatic payout flow.

Standard shop checkout behavior:

1. User adds products to cart.
2. User opens checkout panel.
3. App shows platform USDT TRC20 address.
4. User pays the platform address.
5. User enters transaction hash or uses TronLink.
6. Browser checks recent USDT transfers to the platform address.
7. On success, app records purchase under the user's profile and shows download links.

There is no seller payout in the normal shop checkout.

Important constants in `src/shop/shopData.js`:

```js
PAYMENT_ADDRESS = 'TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei'
PAYMENT_NETWORK = 'USDT TRC20'
USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
USDT_DECIMALS = 6
USDT_TRANSFER_FEE_LIMIT = 100_000_000
```

`P2P_PLATFORM_USDT_ADDRESS` defaults to `PAYMENT_ADDRESS` but can be overridden through:

```txt
VITE_P2P_PLATFORM_USDT_ADDRESS
```

Price helpers:

- `shopPriceToCents`
- `shopCentsToPrice`
- `formatShopPrice`
- `formatUsdtAmount`

Use these instead of ad hoc price math in UI code.

## Browser TRON Utilities

File: `src/shop/tronPayments.js`

Responsibilities:

- Convert USDT amount strings/numbers into smallest units.
- Connect to TronLink wallet.
- Send browser-initiated USDT transfers.
- Check recent USDT transfers for an expected tx hash, amount, recipient, and token contract.

Key functions:

- `usdtToSmallestUnit(amount)`
- `connectTronLinkWallet()`
- `sendUsdtTransfer(tronWeb, amount, recipientAddress)`
- `checkUsdtTransaction(txId, amount, recipientAddress)`
- `createRecentUsdtTransfersUrl(paymentAddress, options)`

Validation rules:

- USDT supports 6 decimals.
- Transaction hashes must be 64 hex characters.
- Recipient address must match exactly.
- Token contract must match USDT TRC20.
- Amount must match exactly in smallest units.

Browser-side transaction checks are useful for UX but are not sufficient for secure P2P settlement. The backend payout function independently verifies the buyer transfer before sending seller funds.

## P2P Marketplace

Primary files:

- `src/components/P2PTradingPage.jsx`
- `src/p2p/p2pData.js`
- `src/p2p/p2pPayouts.js`
- `src/p2p/telegramStorage.js`
- `src/social/SocialContext.jsx`
- `firestore.rules`
- `functions/index.cjs`

The P2P marketplace allows signed-in users to create listings for digital items/services and communicate with buyers.

Listing categories:

- `digital-assets`
- `streaming`
- `guides`
- `services`
- `collectibles`
- `other`

Payment methods:

- `crypto`
- `card`

Current automatic settlement is implemented for crypto listings paid in USDT TRC20.

## P2P Listing Creation

`P2PTradingPage` owns the listing form UI.

Listing form fields include:

- Title.
- Category.
- Price.
- Currency, currently initialized as `USDT`.
- Seller crypto wallet address.
- Delivery method.
- Payment methods.
- Description.
- Properties.
- Preview image.
- Attached files.

Validation highlights:

- User must be signed in.
- Title must be at least 3 characters.
- Price must be finite and non-negative.
- At least one property is required.
- At least one payment method is required.
- If crypto payment is selected, seller wallet address must match the TRON address pattern.
- A listing can have at most 8 files.

Preview images:

- Resized/compressed client-side.
- Max target dimensions are around 960x560.
- JPEG quality is around 0.82.
- Large data URLs are rejected.

Files:

- Uploaded through `uploadTelegramFiles`.
- Uploads are sequential and report progress.
- Stored file metadata is attached to the listing.

## P2P Automatic USDT Checkout

P2P automatic checkout is shown only when a listing is eligible.

Eligibility logic lives in `P2PTradingPage.jsx`, especially:

- `canUseUsdtCheckout(listing)`
- `p2pUsdtPaymentAmount(listing)`
- `p2pCommissionAmount(listing)`
- `p2pSellerPayoutAmount(listing)`
- `p2pPaymentAddress()`

Eligibility requirements:

- Listing includes `crypto` as a payment method.
- Listing currency is `USD` or `USDT`.
- Seller has a valid TRON wallet address.
- Price is finite and greater than 0.
- Viewer is not the seller.
- Listing is not already sold.

Seed listings often do not have seller payout wallet addresses. Those listings should not show the escrow/automatic checkout until a valid seller wallet address exists.

## P2P Commission

The frontend display commission rate is read from:

```txt
VITE_P2P_COMMISSION_RATE
```

Default:

```txt
0.02
```

That means 2 percent.

The backend independently calculates commission using either:

- `P2P_COMMISSION_BPS`, if present.
- `P2P_COMMISSION_RATE`, if present.
- Default 2 percent.

Backend commission math is done in USDT smallest units, not floating point display numbers.

Effective payout math:

```txt
gross = listing price in USDT smallest units
commission = gross * commissionBps / 10000
sellerPayout = gross - commission
```

For a 2 percent commission:

```txt
commissionBps = 200
seller receives 98 percent of gross
platform keeps 2 percent
```

For a 1 percent commission:

```txt
commissionBps = 100
seller receives 99 percent of gross
platform keeps 1 percent
```

When changing commission:

1. Update frontend display env if needed.
2. Update backend env/secret config if needed.
3. Keep backend as source of truth.
4. Verify UI labels and backend settlement response agree.
5. Deploy the function.

## P2P Automatic Payout Flow

The automatic payout function is:

```txt
p2pUsdtPayout
```

Frontend endpoint:

```txt
/api/p2p/payout
```

Raw deployed function URL known from deployment:

```txt
https://p2pusdtpayout-bcjovbww4a-uc.a.run.app
```

Normal buyer flow:

1. Buyer opens an eligible P2P listing.
2. UI shows the platform USDT TRC20 address.
3. Buyer sends the exact listing price in USDT TRC20 to the platform address.
4. Buyer enters the transaction hash in the P2P checkout box.
5. Browser calls `settleP2PUsdtPayment({ listingId, txId })`.
6. `settleP2PUsdtPayment` obtains the buyer's Firebase ID token.
7. Browser POSTs JSON to `/api/p2p/payout`:

```json
{
  "listingId": "listing-id",
  "txId": "64-hex-transaction-id"
}
```

8. Request includes:

```txt
Authorization: Bearer <Firebase ID token>
```

9. Function verifies the Firebase user.
10. Function verifies listing eligibility.
11. Function verifies the buyer is not the seller.
12. Function verifies the tx hash is a confirmed USDT transfer to the platform wallet for the exact gross amount.
13. Function creates or checks an idempotent `p2pDeals/{buyerTxId}` document.
14. Function marks the listing sold while the deal enters processing state.
15. Function sends USDT from the platform wallet to the seller wallet.
16. Seller receives price minus commission.
17. Function stores payout tx hash and deal status.
18. Frontend shows success and offers to message the seller.

## P2P Payout Backend Details

File: `functions/index.cjs`

Function:

```js
exports.p2pUsdtPayout = onRequest(...)
```

Runtime settings:

- Region: `us-central1`.
- Timeout: 120 seconds.
- Memory: 512 MiB.
- Secret: `P2P_PAYOUT_PRIVATE_KEY`.

Security/auth:

- Handles CORS and OPTIONS preflight.
- Allows POST only.
- Requires Firebase Auth bearer token.
- Uses Admin SDK to verify ID token.
- Refuses unauthenticated requests.

Input validation:

- `listingId` is required.
- `txId` is required.
- `txId` must be a 64-character hex string.
- Listing must exist.
- Listing must be eligible for crypto settlement.
- Buyer cannot be seller.
- Seller wallet must be a valid TRON address.
- Platform address must be a valid TRON address.

Blockchain verification:

- Queries TRONGrid account TRC20 transactions for the platform address.
- Uses USDT contract:

```txt
TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
```

- Requests confirmed transactions.
- Checks tx hash.
- Checks recipient is the platform address.
- Checks token contract is USDT.
- Checks amount equals the expected listing gross amount.

If the transfer is not found yet, the function returns pending rather than sending funds.

Payout:

- Creates a TronWeb instance with the private key from Secret Manager.
- Derives the signer address from the private key.
- Requires signer address to match the configured platform address.
- Calls USDT contract `transfer(sellerAddress, sellerPayoutUnits)`.
- Uses `USDT_TRANSFER_FEE_LIMIT`.
- Stores payout transaction id.

The signer address check is important. It prevents accidentally configuring a private key for a different wallet and silently paying from the wrong address.

## P2P Deal Idempotency

Deal document id:

```txt
p2pDeals/{buyerTxId}
```

This makes a buyer transaction hash the idempotency key.

Expected statuses:

- `processing`
  - Function accepted the buyer transaction and is attempting/has attempted payout.
- `payout_sent`
  - Seller payout succeeded.
- `payout_failed`
  - Seller payout failed after buyer payment verification.

Repeat request behavior:

- Same buyer/listing and `payout_sent`: returns success with existing payout tx id.
- Same buyer/listing and `payout_failed`: returns conflict/failure.
- Same buyer/listing and still processing: returns pending/processing.
- Different buyer/listing using same tx id: conflict.

Important:

- Never change idempotency casually.
- Never allow the client to write `p2pDeals`.
- Never pay the seller before verifying buyer transfer.
- Never mark a listing sold without a clear settlement state.

## P2P Failure Modes And Recovery

### Buyer transfer not found

Possible causes:

- Buyer entered wrong tx hash.
- Transfer is not confirmed yet.
- Transfer was sent to the wrong address.
- Transfer amount does not exactly match listing price.
- Transfer was not USDT TRC20.
- TRONGrid has not indexed it yet.

Expected behavior:

- Function returns pending or an explanatory failure.
- Frontend continues polling or shows a message.

### Seller payout fails

Possible causes:

- Platform wallet lacks TRX or energy for transfer fees.
- Private key secret missing.
- Private key does not match platform address.
- TRONGrid/API issue.
- Seller address invalid despite prior checks.
- USDT contract call failed.

Expected behavior:

- Deal is marked `payout_failed`.
- Listing may already be marked sold.
- Manual operator intervention is required.

Manual recovery guidance:

1. Inspect the `p2pDeals/{buyerTxId}` document.
2. Verify the buyer transaction on a TRON explorer.
3. Verify platform wallet balance and TRX/energy.
4. Verify seller wallet address from listing/deal.
5. Send manual payout if appropriate.
6. Update Firestore only with care and with an audit trail.

### Duplicate settlement attempt

Expected behavior:

- Idempotency prevents double payout for the same buyer tx hash.

### Buyer pays after listing already sold

Expected behavior:

- Function should reject settlement once listing is sold by another transaction.
- Manual refund/support may be needed if funds arrived.

## P2P Wallet Requirements

The platform wallet must:

- Be the address shown to buyers.
- Match `P2P_PLATFORM_USDT_ADDRESS`.
- Match the private key stored as `P2P_PAYOUT_PRIVATE_KEY`.
- Hold enough USDT to cover seller payouts after buyer funds arrive.
- Hold enough TRX or energy/bandwidth to pay USDT transfer fees.

The seller wallet must:

- Be a valid TRON address.
- Support USDT TRC20.
- Be provided when creating a crypto listing.

The buyer wallet must:

- Send exact USDT TRC20 amount to the platform address.
- Provide the transaction hash.

## Private Key Source

The private key is exported from the wallet that owns the platform address. In the wallet app screenshot previously provided, this is the "Back Up Private Key" option.

Important handling rules:

- Export only from the platform payout wallet.
- Confirm exported address is `TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei`.
- Store it in Firebase Secret Manager using `firebase functions:secrets:set`.
- Do not store it in the frontend.
- Do not store it in git.
- Do not paste it into this file.
- Do not send it to any third-party service.

If the wallet is compromised, immediately:

1. Stop/disable the payout function or rotate the secret to a safe wallet.
2. Move funds to a new secure wallet.
3. Update platform address env/config.
4. Redeploy frontend and backend.
5. Audit `p2pDeals`.

## Telegram Uploads

There are two possible Telegram upload backends in this repo:

1. Firebase Function:
   - Function name: `telegramUpload`
   - Hosting path: `/api/telegram/upload`
   - Public post media function: `telegramFile`
   - Public post media path: `/api/telegram/file`
   - Source: `functions/index.cjs`

2. Cloudflare Worker:
   - Source: `cloudflare/telegram-upload-worker/`
   - Example endpoint in `.env.example`:

```txt
https://gta-vi-p2p-telegram-upload.antonkerch555.workers.dev/api/telegram/upload
https://gta-vi-p2p-telegram-upload.antonkerch555.workers.dev/api/telegram/file
```

Frontend upload client:

```txt
src/storage/telegramStorage.js
```

Upload request behavior:

- Requires signed-in Firebase user.
- Gets Firebase ID token.
- Sends multipart form data.
- Includes file and metadata such as kind/title.
- Expects stored file metadata in response.

Function upload behavior:

- Requires POST.
- Requires Firebase bearer token.
- Requires `TELEGRAM_BOT_TOKEN`.
- Requires `TELEGRAM_STORAGE_CHAT_ID`.
- Parses multipart with Busboy.
- Enforces `TELEGRAM_MAX_UPLOAD_BYTES`, default 50 MiB.
- Uploads to Telegram Bot API `sendDocument`.
- Returns metadata including Telegram file id and message id.

Post media read behavior:

- Accepts only GET/HEAD requests containing a post id and Telegram file id.
- Verifies that the file id belongs to an `ugc-post-media` attachment on that public Firestore post.
- Resolves the temporary Telegram file path server-side and streams the media without exposing the bot token.
- Supports HTTP range requests for video playback.
- Does not expose P2P listing files through the public media endpoint.

When changing upload behavior:

- Keep browser token verification.
- Keep bot token server-side only.
- Be clear which endpoint production uses.
- Do not expose Telegram file management secrets.

## Standard Shop Checkout Vs P2P Checkout

These are separate systems.

Standard shop checkout:

- Buyer pays platform address.
- Browser verifies transfer for UX.
- Purchase is recorded for buyer.
- Download links are shown.
- No seller payout.
- Main UI: `CryptoCheckoutPanel.jsx`.

P2P checkout:

- Buyer pays platform address.
- Backend verifies transfer.
- Backend calculates commission.
- Backend pays seller.
- Backend writes `p2pDeals`.
- Listing is marked sold.
- Main UI: `P2PUsdtCheckoutBox` inside `P2PTradingPage.jsx`.

Do not reuse frontend-only shop verification as the sole settlement proof for P2P. P2P must go through the backend payout function.

## Frontend P2P Payout Client

File: `src/p2p/p2pPayouts.js`

Main function:

```js
settleP2PUsdtPayment({ listingId, txId })
```

Behavior:

- Requires current Firebase Auth user.
- Gets ID token.
- Sends POST JSON to `VITE_P2P_PAYOUT_ENDPOINT` or `/api/p2p/payout`.
- Includes Authorization bearer token.
- Normalizes backend errors.

Do not include private key logic here.

## P2P UI Checkout States

The P2P checkout box:

- Shows buyer amount.
- Shows platform address.
- Shows commission amount/rate.
- Shows seller payout estimate.
- Accepts transaction hash.
- Calls payout endpoint.
- Polls while pending.
- Shows payout transaction id on success.
- Offers to message seller after success.

When adjusting UI copy:

- Make clear that buyers pay the platform escrow address.
- Make clear that sellers receive net amount after commission.
- Avoid promising irreversible delivery before payout success.
- Avoid exposing implementation secrets.

## Current Deployment State Notes

The automatic payout implementation has been deployed before.

Known deployment facts:

- `p2pUsdtPayout` deployed successfully as a v2 HTTPS function.
- Region: `us-central1`.
- Runtime: `nodejs20`.
- Memory: 512 MiB.
- Secret `P2P_PAYOUT_PRIVATE_KEY` was set in Firebase Secret Manager.
- Hosting and Firestore rules were deployed with the payout work.
- IAM issue was fixed by granting Cloud Build builder role to:

```txt
658433302308-compute@developer.gserviceaccount.com
```

Using:

```sh
gcloud projects add-iam-policy-binding gta-vi-fan-site \
  --member="serviceAccount:658433302308-compute@developer.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"
```

The user already ran this successfully in Cloud Shell.

Firebase CLI may warn:

- Node.js 20 runtime has a future deprecation/decommission timeline.
- `firebase-functions` package may be outdated.

These are maintenance items. Do not ignore them during serious production hardening.

## Deployment Checklist For Payment Changes

Before deploying payment-related changes:

1. Read changed files.
2. Confirm no secrets are present.
3. Run syntax check:

```sh
node --check functions/index.cjs
```

4. Run lint:

```sh
npm run lint
```

5. Run build:

```sh
npm run build
```

6. Confirm Firestore rules still match client writes.
7. Confirm `P2P_PLATFORM_USDT_ADDRESS` matches the private key signer.
8. Confirm wallet has TRX/energy.
9. Confirm commission rate is what the business expects.
10. Deploy only the necessary targets.

Suggested deploy:

```sh
firebase deploy --only functions:p2pUsdtPayout,firestore:rules,hosting --project gta-vi-fan-site --force
```

After deploy:

1. Confirm function appears active in Firebase/Cloud Run.
2. Confirm Hosting route `/api/p2p/payout` reaches the function.
3. Test with a small amount before production use.
4. Inspect `p2pDeals` for expected records.
5. Inspect listing status transition.
6. Verify seller receives net payout.

## Firebase CLI Notes

The local Firebase CLI path observed previously:

```txt
/opt/homebrew/bin/firebase
```

It is logged in as:

```txt
antonkerch555@gmail.com
```

When running in a sandboxed agent environment, Firebase CLI commands may need elevated permissions because the CLI writes config/cache files outside the workspace.

Local `gcloud` may not be installed. Cloud Shell can be used for IAM changes.

## Payment Security Rules For Agents

Payment-related code must follow these rules:

- Backend is the source of truth for P2P settlement.
- Frontend may display commission but must not be trusted for commission math.
- Never trust client-provided seller payout amount.
- Never trust client-provided commission amount.
- Never trust client-provided buyer uid; use verified Firebase token.
- Never send seller payout before confirming buyer transfer.
- Never use a private key in browser code.
- Never log private keys.
- Never return private keys in API responses.
- Never allow client writes to `p2pDeals`.
- Never relax Firestore rules for convenience.
- Use exact integer smallest-unit math for USDT.
- Validate token contract, recipient, txid, and amount.
- Keep idempotency behavior intact.
- Treat failed payout states as requiring manual financial review.

## USDT/TRON Details

Network:

```txt
TRON mainnet
```

Token:

```txt
USDT TRC20
```

USDT contract:

```txt
TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
```

Decimals:

```txt
6
```

Common display:

```txt
1 USDT = 1_000_000 smallest units
```

Fee handling:

- USDT transfer requires TRX or energy.
- A wallet with USDT but no TRX/energy may fail to send payouts.
- `USDT_TRANSFER_FEE_LIMIT` exists to cap transaction fee usage.

TRON address validation:

- TRON addresses generally start with `T`.
- Use TronWeb validation where available on backend.
- Frontend regex is a quick UI guard, not final security.

## Checkout Verification Details

A transaction should be accepted only if:

- Hash is valid 64-character hex.
- Transfer is confirmed.
- Token contract is USDT TRC20.
- Recipient is the expected platform address.
- Amount equals expected amount in smallest units.
- Transaction has not already been used for a different deal.

Do not accept:

- Wrong token.
- Wrong network.
- Wrong amount.
- Wrong recipient.
- Unconfirmed transfer as final.
- Screenshots as proof.
- Client assertions without chain verification.

## Common Development Tasks

### Change P2P Commission

Files/config likely involved:

- `.env.example`
- `functions/.env.example`
- Firebase Functions environment/secret config.
- Possibly `src/shop/shopData.js` if default changes.
- `functions/index.cjs` if logic changes.

Steps:

1. Decide whether changing frontend display, backend source of truth, or both.
2. Prefer backend env (`P2P_COMMISSION_BPS` or `P2P_COMMISSION_RATE`) as the production source.
3. Keep frontend `VITE_P2P_COMMISSION_RATE` aligned for display.
4. Build/test.
5. Deploy function and Hosting if frontend changed.

### Change Platform Wallet Address

Files/config likely involved:

- `.env.example`
- `functions/.env.example`
- `functions/.env`
- Firebase Functions env config.
- `src/shop/shopData.js` default if changing hardcoded fallback.

Critical steps:

1. Export private key for the new platform wallet.
2. Set `P2P_PAYOUT_PRIVATE_KEY` to the new key.
3. Set frontend/backend platform address to the new address.
4. Confirm backend signer address check passes.
5. Confirm new wallet has TRX/energy.
6. Deploy backend and frontend.
7. Make a tiny test purchase.

Never point frontend to one wallet while backend private key belongs to another.

### Add A New P2P Payment Method

Files likely involved:

- `src/p2p/p2pData.js`
- `src/components/P2PTradingPage.jsx`
- `firestore.rules`
- Potential backend settlement code if automatic settlement is needed.

Steps:

1. Add display metadata.
2. Add form support.
3. Add validation.
4. Update Firestore rules to allow the new method.
5. Decide if automatic checkout applies.
6. If backend settlement applies, implement a dedicated verifier/payout flow.

### Add New Listing Fields

Files likely involved:

- `src/components/P2PTradingPage.jsx`
- `src/social/SocialContext.jsx`
- `firestore.rules`
- Potential seed data in `src/p2p/p2pData.js`

Steps:

1. Add UI field.
2. Add validation/normalization.
3. Add Firestore write shape.
4. Update Firestore rules allowed fields and validators.
5. Update details display.
6. Test create and edit.

### Change Shop Product Data

File:

- `src/shop/shopData.js`

Steps:

1. Update product data.
2. Keep price formatting helpers unchanged unless required.
3. Confirm cart total and checkout amount.
4. Confirm download URL behavior.
5. Build.

### Change Telegram Upload Backend

Files/config likely involved:

- `src/p2p/telegramStorage.js`
- `.env.example`
- `firebase.json`
- `functions/index.cjs`
- `cloudflare/telegram-upload-worker/`

Steps:

1. Decide Firebase Function or Cloudflare Worker.
2. Keep auth token verification.
3. Keep bot token server-side.
4. Update endpoint env.
5. Test upload with real auth.

## Coding Conventions

General:

- Follow existing patterns before introducing new abstractions.
- Keep changes scoped.
- Use existing helpers for formatting, Firebase access, and price math.
- Avoid unrelated refactors.
- Keep comments succinct and useful.
- Prefer clear names over comments where possible.

Frontend:

- Use React functional components and hooks, matching existing style.
- Keep route-level state in `App.jsx` unless a feature already owns its state elsewhere.
- Use `SocialContext` for social/auth/firestore operations.
- Keep payment secrets out of all frontend code.
- Prefer existing UI patterns and CSS conventions.

Backend Functions:

- Keep CORS and method handling explicit.
- Validate inputs early.
- Return structured JSON errors.
- Use Admin SDK for trusted Firestore writes.
- Keep financial math integer-based.
- Keep idempotency for money movement.
- Avoid long synchronous work outside function timeouts.

Firestore:

- Rules and client payloads must evolve together.
- Do not create broad write permissions.
- Deny client writes for backend-owned financial records.

## Testing And Verification

Minimum checks after normal frontend changes:

```sh
npm run lint
npm run build
```

Minimum checks after Functions changes:

```sh
node --check functions/index.cjs
npm run build
```

Recommended checks after payment changes:

- Lint.
- Build.
- Function syntax check.
- Review Firestore rules.
- Review exact env values.
- Deploy to production only after a small controlled test.
- Verify with real TRON explorer data.
- Inspect Firestore `p2pDeals`.

Manual P2P payout test checklist:

1. Create a test seller account.
2. Add a valid seller TRON address.
3. Create a low-price listing.
4. Open listing as a different buyer account.
5. Send exact USDT TRC20 amount to platform address.
6. Submit tx hash.
7. Wait for function success.
8. Confirm seller payout tx hash.
9. Confirm listing becomes sold.
10. Confirm `p2pDeals/{buyerTxId}` has expected status and amounts.

## Known Risks And Maintenance Items

### Node.js 20 Runtime Deprecation

Firebase has warned that Node.js 20 has a future deprecation/decommission timeline. Plan to upgrade the Functions runtime before it becomes a production risk.

Likely files:

- `functions/package.json`
- Function deployment/runtime config.

### Outdated `firebase-functions`

Firebase deploy warned that `firebase-functions` may be outdated. Updating may be required for newer runtimes and security fixes.

Update carefully:

1. Check Firebase Functions migration notes.
2. Update `functions/package.json`.
3. Run install.
4. Run syntax/build checks.
5. Deploy a single function first if possible.

### TRONGrid Indexing And Limits

The payout verifier looks at recent TRC20 transfers for the platform account. If many payments happen quickly, a fixed recent limit can miss an older transaction.

Potential hardening:

- Query by transaction id through a more direct endpoint.
- Page through TRONGrid results.
- Store pending tx attempts.
- Add admin retry tooling.

### Live Money Movement

The payout function sends real USDT. Bugs can lose funds.

Before modifying:

- Read the entire payout function.
- Keep idempotency.
- Keep signer address check.
- Keep exact transfer verification.
- Use tiny test amounts.

### Dual Telegram Upload Backends

The repo contains both a Firebase Function and a Cloudflare Worker path for Telegram uploads.

Risk:

- Frontend may point to one endpoint while deployment expectations assume another.

When debugging uploads, first check:

- `VITE_TELEGRAM_UPLOAD_ENDPOINT`
- `VITE_TELEGRAM_FILE_ENDPOINT`
- Firebase Hosting rewrite for `/api/telegram/upload`
- Firebase Hosting rewrite for `/api/telegram/file`
- Worker deployment state
- Firebase Function logs

### Seed Listings

Seed listings are useful for visual/demo content, but they may not have seller payout addresses. Automatic checkout should require a valid seller wallet and should not appear for incomplete seed data.

## Production Operations

Useful places to inspect:

- Firebase Console: Functions logs.
- Google Cloud Run logs for v2 functions.
- Firestore `p2pListings`.
- Firestore `p2pDeals`.
- TRON explorer for buyer and payout tx hashes.
- Firebase Auth user records.

For a failed payout:

1. Locate deal by buyer tx hash.
2. Confirm buyer paid correctly.
3. Confirm payout error.
4. Check wallet TRX/energy.
5. Check secret/address match.
6. Decide manual payout/refund.
7. Keep an audit trail.

For suspected abuse:

1. Disable listing or account where possible.
2. Check `p2pDeals` and messages.
3. Verify chain transactions.
4. Avoid deleting financial audit records.

## API Contract: P2P Payout

Endpoint:

```txt
POST /api/p2p/payout
```

Headers:

```txt
Authorization: Bearer <Firebase ID token>
Content-Type: application/json
```

Request body:

```json
{
  "listingId": "string",
  "txId": "64-character hex string"
}
```

Possible response concepts:

```json
{
  "status": "pending",
  "message": "Transfer is not confirmed yet."
}
```

```json
{
  "status": "success",
  "payoutTxId": "seller payout transaction id",
  "buyerTxId": "buyer transaction id",
  "commissionAmount": "0.020000",
  "sellerPayoutAmount": "0.980000"
}
```

```json
{
  "error": "Human-readable error message"
}
```

Do not depend on frontend-calculated commission for settlement. The response should be treated as backend truth.

## API Contract: Telegram Upload

Endpoint depends on env:

```txt
POST /api/telegram/upload
```

or:

```txt
POST <Cloudflare Worker upload endpoint>
```

Headers:

```txt
Authorization: Bearer <Firebase ID token>
```

Body:

```txt
multipart/form-data
```

Expected concepts:

- One uploaded file.
- Optional metadata such as kind/title.
- Response includes stored provider metadata.

Never expose Telegram bot token in this flow.

## Data Integrity Rules For Payments

Amounts:

- Store and compare exact smallest units in backend.
- Display formatted decimal strings in frontend.
- Avoid binary floating point for settlement.

Addresses:

- Normalize/validate where possible.
- Compare intended recipient exactly.
- Confirm private key signer equals platform address.

Transactions:

- Treat tx hash as immutable idempotency key.
- Do not allow one tx hash to settle multiple listings.
- Do not allow one tx hash to settle for different buyers.

Listings:

- A listing should move to sold once a valid settlement is being processed.
- Failed payout needs manual handling, not silent relisting.

Deals:

- Keep deal records as audit data.
- Avoid destructive edits.
- Prefer adding explicit status/error fields over deleting records.

## Agent Workflow Recommendations

Before editing:

1. Inspect relevant files.
2. Check `git status`.
3. Identify whether the change touches money/auth/rules/deploy.
4. If money/auth/rules/deploy are touched, read this file's relevant sections.

During editing:

- Use `apply_patch` for manual edits.
- Keep changes narrow.
- Preserve user changes.
- Do not add secrets.
- Update docs/examples when behavior changes.

After editing:

- Run the smallest meaningful verification.
- For frontend, build/lint.
- For functions, syntax check.
- For Firestore rules, deploy/test as needed.
- Summarize changed files and verification.

## Where To Make Specific Changes

Change homepage content:

- `src/App.jsx`
- Components under `src/components/`
- Related CSS/assets.

Change shop products:

- `src/shop/shopData.js`

Change shop checkout behavior:

- `src/components/CryptoCheckoutPanel.jsx`
- `src/shop/tronPayments.js`
- `src/shop/shopData.js`

Change P2P listing UI:

- `src/components/P2PTradingPage.jsx`

Change P2P listing data/categories:

- `src/p2p/p2pData.js`

Change P2P payout API client:

- `src/p2p/p2pPayouts.js`

Change automatic payout backend:

- `functions/index.cjs`

Change Firestore write permissions:

- `firestore.rules`

Change Firebase Hosting/function rewrites:

- `firebase.json`

Change Firebase client config behavior:

- `src/firebase/firebaseClient.js`

Change social data behavior:

- `src/social/SocialContext.jsx`

Change Telegram upload frontend:

- `src/storage/telegramStorage.js`

Change Telegram upload Firebase backend:

- `functions/index.cjs`

Change Telegram upload Cloudflare backend:

- `cloudflare/telegram-upload-worker/`

## Final Reminders

- This project can move real money.
- Frontend checks improve UX but backend checks protect funds.
- The payout private key belongs only in Firebase Secret Manager.
- The platform address, displayed address, and private key signer must match.
- Firestore rules are part of the product, not optional hardening.
- Keep `p2pDeals` backend-owned.
- Test payment changes with tiny amounts.
- When in doubt, prefer a pending/manual-review state over an automatic payout.
