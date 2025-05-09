import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Consolidated Firebase config for nodal-alcove-457508-h6
const firebaseConfig = {
  apiKey: "AIzaSyAXzoSDn1l6-1Uvpnq8oqOB4sFykSCNyUQ", // User provided key
  authDomain: "nodal-alcove-457508-h6.firebaseapp.com",
  projectId: "nodal-alcove-457508-h6",
  storageBucket: "nodal-alcove-457508-h6.firebasestorage.app", // Make sure this is correct in Firebase console
  messagingSenderId: "148163978225",
  appId: "1:148163978225:web:4682f163f69464feff9a50",
  measurementId: "G-NNFYSN7NEL" // Optional
};

let app: FirebaseApp;

// Initialize the default app if it hasn't been initialized
// This handles HMR (Hot Module Replacement) correctly.
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Get the default app if already initialized
}

// Initialize Auth with persistence based on platform
export const auth = initializeAuth(app, {
  // Apply persistence only on native platforms (iOS, Android)
  ...(Platform.OS !== 'web' ? { persistence: getReactNativePersistence(ReactNativeAsyncStorage) } : {}),
});

// Export other services using the single, default app instance
export const storage = getStorage(app);
export const db = getFirestore(app);

// Optionally initialize and export Analytics if needed
// export const analytics = getAnalytics(app);

// Note: Removed the secondary app initialization ('firestoreApp')
// and the old configurations for Project A and Project B.
