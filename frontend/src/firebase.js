/**
 * @fileoverview Firebase Client SDK Configuration
 * 
 * Initializes Firebase client SDK for authentication, Firestore database,
 * and Cloud Storage. Exports configured service instances for use throughout
 * the application.
 * 
 * @module firebase
 * @requires firebase/app
 * @requires firebase/auth
 * @requires firebase/firestore
 * @requires firebase/storage
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Firebase configuration object populated from environment variables.
 * @type {Object}
 * @property {string} apiKey - Firebase API key
 * @property {string} authDomain - Firebase auth domain
 * @property {string} projectId - Firebase project ID
 * @property {string} storageBucket - Cloud Storage bucket URL
 * @property {string} messagingSenderId - Firebase messaging sender ID
 * @property {string} appId - Firebase app ID
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/** @type {FirebaseApp} Initialized Firebase application instance */
const app = initializeApp(firebaseConfig);

/** @type {Auth} Firebase Authentication instance */
export const auth = getAuth(app);

/** @type {Firestore} Firestore database instance */
export const db = getFirestore(app);

/** @type {FirebaseStorage} Firebase Cloud Storage instance */
export const storage = getStorage(app);

/** @type {GoogleAuthProvider} Google OAuth provider for sign-in */
export const googleProvider = new GoogleAuthProvider();

export default app;
