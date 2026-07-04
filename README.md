# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Firebase social features

The community/social section uses Firebase Auth and Cloud Firestore.
The news section parses live GTA VI coverage from IGN in the frontend at runtime.

For local development, either run through Firebase Hosting's reserved config endpoint or set the Vite variables from `.env.example`. The Vite dev server proxies `/__/firebase/init.json` to the configured Firebase Hosting project.

IGN wiki sections can translate parsed English content in the browser through Google Cloud Translation Basic. Set `VITE_GOOGLE_TRANSLATE_API_KEY` in `.env.local`; translated payloads are cached in `localStorage` by language and parsed content hash, so unchanged IGN text is not translated again on the same browser.

Community posts can attach up to four images/videos (20 MiB each). Media is uploaded through the authenticated Telegram storage bridge and streamed through `VITE_TELEGRAM_FILE_ENDPOINT`; the bot token remains server-side. Deploy the matching `telegramUpload`/`telegramFile` Firebase Functions or the Cloudflare Worker plus the updated Firestore rules before enabling this in production.

Authenticated account settings use the `accountManagement` Firebase Function through `/api/account`. Deploy that function together with the updated Firestore rules before enabling session revocation, account export, or account deletion in production:

```sh
firebase deploy --only functions:accountManagement,firestore:rules,hosting --project gta-vi-fan-site
```

Before sign-up, posting, voting, source submissions, comments, and messages can work against the live project:

- Enable Firebase Authentication with the Email/Password provider.
- Create/enable Cloud Firestore for the project.
- Deploy Firestore rules and indexes:

```sh
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
