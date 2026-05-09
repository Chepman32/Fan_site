let firebaseServicesPromise

function envConfig() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }

  return Object.values(config).every(Boolean) ? config : null
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

export async function getFirebaseServices() {
  if (!firebaseServicesPromise) {
    firebaseServicesPromise = Promise.all([
      loadFirebaseConfig(),
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
    ]).then(([config, appModule, authModule, firestoreModule]) => {
      const { initializeApp } = appModule
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
      const app = initializeApp(config)
      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        addDoc,
        arrayRemove,
        arrayUnion,
        collection,
        createUserWithEmailAndPassword,
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
    })
  }

  return firebaseServicesPromise
}
