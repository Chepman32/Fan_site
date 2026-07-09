let firebaseAppPromise
let firebaseServicesPromise
let firebaseAnalyticsPromise
let firebaseAppCheckPromise

function envConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }
  const requiredConfig = [
    config.apiKey,
    config.authDomain,
    config.projectId,
    config.storageBucket,
    config.messagingSenderId,
    config.appId,
  ]

  return requiredConfig.every(Boolean) ? config : null
}

async function hostingConfig() {
  const response = await fetch('/__/firebase/init.json')
  if (!response.ok) {
    throw new Error('Firebase Hosting config was not available.')
  }

  return response.json()
}

async function loadFirebaseConfig() {
  const config = envConfig()
  if (config) return config

  return hostingConfig()
}

async function getFirebaseApp() {
  if (!firebaseAppPromise) {
    firebaseAppPromise = import('firebase/app').then(async (appModule) => {
      const { getApps, initializeApp } = appModule
      const existingApp = getApps()[0]

      if (existingApp) return existingApp

      return initializeApp(await loadFirebaseConfig())
    }).catch((error) => {
      firebaseAppPromise = null
      throw error
    })
  }

  return firebaseAppPromise
}

async function initializeFirebaseAppCheck(app) {
  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim()
  if (typeof window === 'undefined' || !siteKey) return null

  if (!firebaseAppCheckPromise) {
    firebaseAppCheckPromise = import('firebase/app-check')
      .then(({ initializeAppCheck, ReCaptchaV3Provider }) => initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      }))
      .catch((error) => {
        firebaseAppCheckPromise = null
        if (import.meta.env.DEV) {
          console.warn('Firebase App Check was not initialized.', error)
        }
        return null
      })
  }

  return firebaseAppCheckPromise
}

export async function initializeFirebaseAnalytics() {
  if (!firebaseAnalyticsPromise) {
    firebaseAnalyticsPromise = Promise.all([
      getFirebaseApp(),
      import('firebase/analytics'),
    ])
      .then(async ([app, analyticsModule]) => {
        const { initializeAnalytics, isSupported } = analyticsModule

        if (!app.options.measurementId || !(await isSupported())) {
          return null
        }

        return initializeAnalytics(app, {
          config: {
            send_page_view: false,
          },
        })
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('Firebase Analytics was not initialized.', error)
        }

        return null
      })
  }

  return firebaseAnalyticsPromise
}

export async function logAnalyticsPageView(pagePath = `${window.location.pathname}${window.location.hash}`) {
  try {
    const analytics = await initializeFirebaseAnalytics()
    if (!analytics) return

    const { logEvent } = await import('firebase/analytics')

    logEvent(analytics, 'page_view', {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Firebase page view was not logged.', error)
    }
  }
}

export async function getFirebaseServices() {
  if (!firebaseServicesPromise) {
    firebaseServicesPromise = Promise.all([
      getFirebaseApp(),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]).then(async ([app, authModule, firestoreModule]) => {
      await initializeFirebaseAppCheck(app)

      const {
        createUserWithEmailAndPassword,
        EmailAuthProvider,
        getAuth,
        onAuthStateChanged,
        reauthenticateWithCredential,
        sendEmailVerification,
        sendPasswordResetEmail,
        signInWithEmailAndPassword,
        signOut,
        updatePassword,
        updateProfile,
      } = authModule
      const {
        addDoc,
        arrayRemove,
        arrayUnion,
        collection,
        deleteDoc,
        doc,
        getDoc,
        getFirestore,
        onSnapshot,
        query,
        runTransaction,
        serverTimestamp,
        setDoc,
        updateDoc,
        where,
      } = firestoreModule

      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        addDoc,
        arrayRemove,
        arrayUnion,
        collection,
        createUserWithEmailAndPassword,
        deleteDoc,
        doc,
        EmailAuthProvider,
        getDoc,
        onAuthStateChanged,
        onSnapshot,
        query,
        reauthenticateWithCredential,
        runTransaction,
        sendEmailVerification,
        sendPasswordResetEmail,
        serverTimestamp,
        setDoc,
        signInWithEmailAndPassword,
        signOut,
        updatePassword,
        updateDoc,
        updateProfile,
        where,
      }
    }).catch((error) => {
      // A temporary config or chunk-loading failure should not poison every
      // future auth attempt for the lifetime of the page.
      firebaseServicesPromise = null
      throw error
    })
  }

  return firebaseServicesPromise
}
