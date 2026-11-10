# Stars payments in the existing billed project

The Stars checkout went live on November 10, 2026. The `leonida-stars` service in `fan-site-496610` serves the shop API and the registered @FSFESbot webhook. Telegram verified version 5 of `TELEGRAM_STARS_BOT_TOKEN`. The live shop build, API health, price table, authentication boundary, and webhook configuration passed checks. A private 1-Star test order verified live payment, profile download, and refund. The test order lost download access after the refund.

The billing account has reached its project-link quota, so the Stars service runs in **fan-site-496610**, which already has billing enabled. Firebase Authentication, Firestore, and the public site stay in **gta-vi-fan-site**. This route does not create another project, attach billing to another project, add Firebase to the billed project, or migrate users/data.

## Deployment boundary

| Resource | Project |
| --- | --- |
| Stars Cloud Run service, source builds, and two Secret Manager secrets | fan-site-496610 |
| Existing Firebase Auth users, Firestore orders and audit records, rules/indexes | gta-vi-fan-site |
| Existing Firebase Hosting and leonidaloot.com | gta-vi-fan-site |

The runtime explicitly selects the original Auth project for ID-token audience and revocation checks; it does not infer the audience from its billing/deployment project. The browser's existing Firebase configuration stays the same. [Firebase token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens).

## 1. Store the bot credential in the billed project

Open the API Token view for @FSFESbot in BotFather and copy its current token. Run the following command in Terminal and paste the token at the hidden prompt. The script saves it to Firebase after Telegram verifies @FSFESbot.

```sh
node /Users/antonchepur/Documents/Fan_site/scripts/setup-stars-bot.mjs --save-token
```

Use the same verified token for the Cloudflare storage worker. Both services use the credential for @FSFESbot.

I created TELEGRAM_STARS_WEBHOOK_SECRET in fan-site-496610 on November 8, 2026. Use the following command if you need to recreate it later.

```sh
node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))' | firebase functions:secrets:set TELEGRAM_STARS_WEBHOOK_SECRET --data-file - --project fan-site-496610
```

Both secrets must have an enabled version. Values never belong in the repository, frontend env, command arguments, or chat.

## 2. Review and run the deployment helper

From this repository checkout, using a terminal with the Google Cloud CLI (`gcloud`) installed and authenticated:

```sh
npm run test:stars:coverage
npm run lint
npm run stars:cloud:deploy
```

Google Cloud Shell already includes gcloud; use a checkout there if it is not installed locally. The helper checks secret metadata before making IAM or deployment changes, then:

- Enables Cloud Run, Cloud Build, Artifact Registry, IAM, Secret Manager, Identity Toolkit, and Firestore APIs in fan-site-496610. The last two allow the runtime to call Firebase services in the original project.
- Creates two dedicated service accounts: stars-payments for runtime and stars-build for source builds.
- Grants the runtime `roles/datastore.user` and `roles/firebaseauth.viewer` in gta-vi-fan-site, and Secret Accessor on just the two Stars secrets in fan-site-496610.
- Grants the build account `roles/run.builder` in the billed project.
- Packages only the shared Stars modules and static price catalog, then builds/deploys the Node.js 22 service. Wallet, Telegram storage, and unrelated Functions code/env files are excluded from the build context.
- Runs with zero minimum instances, a maximum of two instances, and explicitly pinned secret versions. It prints the service's actual URL.

**IAM scope:** datastore.user permits database read/write access; it cannot be limited to just Stars collections through these Firestore IAM roles. This service identity is trusted backend code. Direct browser access to Stars collections stays denied by rules. No service-account JSON key is created. [Firebase Auth roles](https://firebase.google.com/docs/projects/iam/roles-predefined-product), [Firestore IAM](https://docs.cloud.google.com/firestore/native/docs/security/iam).

The service must allow unauthenticated HTTP invocation for browser preflight and Telegram delivery. Application requests still require Firebase ID tokens, operator actions require the admin claim, and webhook updates require their separate secret header. [Cloud Run source deployment](https://docs.cloud.google.com/run/docs/deploying-source-code).

## 3. Publish the frontend with the remote API

Use the actual URL printed by deployment. Set a local shell variable (this URL is public configuration, not a credential):

```sh
STARS_SERVICE_URL=https://leonida-stars-whbnsgfjma-uc.a.run.app
curl --fail "$STARS_SERVICE_URL/health"
curl --fail "$STARS_SERVICE_URL/api/shop/stars/config"
VITE_TELEGRAM_STARS_API_ENDPOINT="$STARS_SERVICE_URL/api/shop/stars" npm run stars:hosting
```

The hosting helper builds with this endpoint and deploys Hosting plus Firestore rules/indexes to gta-vi-fan-site. It generates a temporary config that removes Stars rewrites to the unbilled Functions project while retaining unrelated existing rewrites. It does not deploy Functions in the unbilled project. Wait for the order-history index to be ready.

Save the public VITE_TELEGRAM_STARS_API_ENDPOINT value in ignored `.env.production.local` for later ordinary production builds. For development through Vite's proxy, use `STARS_DEV_API_ORIGIN="$STARS_SERVICE_URL" npm run dev` and leave the development VITE_TELEGRAM_STARS_API_ENDPOINT blank.

## 4. Check the bot route, then activate it

```sh
npm run stars:bot -- --project fan-site-496610 --webhook-url "$STARS_SERVICE_URL/api/telegram/stars/webhook" --check
npm run stars:bot -- --project fan-site-496610 --webhook-url "$STARS_SERVICE_URL/api/telegram/stars/webhook" --configure
```

The helper verifies @FSFESbot's identity and refuses to replace a different existing webhook. Any separate getUpdates consumer must be stopped or integrated first. Existing storage API calls can continue. No payment is made by these scripts.

Complete a controlled purchase and refund, including profile history and recovery after closing the checkout, before general launch. `/paysupport ORDER_NUMBER description` and operator refund/reconciliation routes are described in the main Stars guide.

## Scope and limits

- Local tests verify the HTTP adapter, project selection, Auth delegation, payment lifecycle, browser flow, and Firestore rules. Actual cross-project IAM access and bot delivery require a deployed smoke test.
- The existing account-management function has Stars export/deletion updates in source, but publishing this Stars-only service does not migrate that separate account-management endpoint or solve its existing unbilled runtime restriction. Keep its deployment/availability tracked separately; operator account-deletion requests must include retained Stars records as described in the main guide.
- Shared Google Drive download links retain the existing delivery limitation; this service does not make the originals private storage.
- Source builds, service execution, and secrets use the already enabled billing account of fan-site-496610. There is no new project-to-billing-account association.

The same-project Firebase Functions deployment remains available as an alternative if billing capacity becomes available later, but the Cloud Run route above is the current setup for the quota constraint.
