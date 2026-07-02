let firebaseAppPromise
let firebaseServicesPromise
let firebaseAnalyticsPromise

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
    ]).then(([app, authModule, firestoreModule]) => {
      const {
        createUserWithEmailAndPassword,
        getAuth,
        onAuthStateChanged,
        signInWithEmailAndPassword,
        signOut,
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
        getDoc,
        onAuthStateChanged,
        onSnapshot,
        query,
        runTransaction,
        serverTimestamp,
        setDoc,
        signInWithEmailAndPassword,
        signOut,
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
