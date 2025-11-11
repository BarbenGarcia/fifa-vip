# Firebase Hosting for FIFA VIP Dashboard

This guide shows how to deploy the static frontend to Firebase Hosting and (optionally) add the Firebase JavaScript SDK to your web app.

The backend (Express + tRPC + Supabase) should run elsewhere (e.g., Render). Use `VITE_API_BASE_URL` so the frontend knows where to call the backend.

---

## 1) Install Firebase CLI (Linux)

```bash
npm install -g firebase-tools
firebase --version
firebase login
```

If the global install fails due to permissions, try:

```bash
# Option A: Use corepack-managed pnpm and a user npm prefix
npm config set prefix ~/.npm-global
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g firebase-tools

# Option B: via npx (no global install)
npx firebase-tools --version
npx firebase login
```

---

## 2) Initialize Hosting (once per project)

We've included a minimal `firebase.json` and `.firebaserc`.
If you prefer the wizard, you can run:

```bash
firebase init hosting
```

Choose:
- Use an existing project (or create one in the console first)
- Public directory: `dist/public`
- Configure as a single-page app: `Yes`
- Skip automatic builds in the wizard (we already use `pnpm build`)

---

## 3) Build the frontend with remote backend URL

Set `VITE_API_BASE_URL` to your deployed backend origin (no trailing slash). The app will call `${VITE_API_BASE_URL}/api/trpc`.

```bash
export VITE_API_BASE_URL="https://your-backend.example.com"
pnpm build
```

This outputs static assets to `dist/public/` (as configured in `firebase.json`).

---

## 4) Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

After deploy, Firebase will print your Hosting URL (e.g., `https://<project-id>.web.app`).

---

## 5) Optional: GitHub Action for automatic deploys

In the Firebase console (Hosting → GitHub), connect your repository to deploy on pushes.

---

## Add Firebase JavaScript SDK (optional)

If you want to use Firebase services (Analytics, Authentication, Firestore, etc.) in the frontend:

### a) Install the SDK

```bash
pnpm add firebase
```

### b) Create environment variables for Vite

Add the following to your environment (for builds) or to a `.env` file you source before `pnpm build`:

```bash
export VITE_FIREBASE_API_KEY="..."
export VITE_FIREBASE_AUTH_DOMAIN="..."
export VITE_FIREBASE_PROJECT_ID="..."
export VITE_FIREBASE_STORAGE_BUCKET="..."
export VITE_FIREBASE_MESSAGING_SENDER_ID="..."
export VITE_FIREBASE_APP_ID="..."
# Optional for Analytics
export VITE_FIREBASE_MEASUREMENT_ID="..."
```

You can copy these values from your Firebase project settings (Web app config).

### c) Initialize Firebase in your app

Create a small helper (for example usage only; do not import unless you intend to use Firebase):

```ts
// Example: client-side Firebase init (do not import unless used)
import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'
// Optional services
// import { getAuth } from 'firebase/auth'
// import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

let app: FirebaseApp | undefined
export function getFirebaseApp() {
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export async function initAnalytics() {
  if (import.meta.env.PROD && firebaseConfig.measurementId) {
    const supported = await analyticsSupported()
    if (supported) getAnalytics(getFirebaseApp())
  }
}

// Example usage in a component:
// useEffect(() => { initAnalytics() }, [])
// const auth = getAuth(getFirebaseApp())
// const db = getFirestore(getFirebaseApp())
```

Notes:
- Keep this module un-imported unless you actually need Firebase; otherwise remove `firebase` from dependencies.
- Only enable Analytics in production and when `measurementId` exists to avoid errors in dev.

---

## Troubleshooting

- 404s on page reloads: ensure `firebase.json` has the SPA rewrite to `/index.html`.
- Backend calls failing: confirm `VITE_API_BASE_URL` matches your backend origin and that CORS is allowed on the backend.
- CLI permissions: use the user-level npm prefix shown above or `npx`.
