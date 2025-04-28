import { initializeApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getStorage, connectStorageEmulator } from "firebase/storage"
import Constants from "expo-constants"

// Firebase設定
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
}

// Firebaseの初期化
const app = initializeApp(firebaseConfig)

// 各サービスの取得
export const auth = getAuth(app)
export const firestore = getFirestore(app)
export const storage = getStorage(app)

// 開発環境の場合、エミュレータに接続
if (__DEV__) {
  const host = "127.0.0.1"
  connectAuthEmulator(auth, `http://${host}:9099`)
  connectFirestoreEmulator(firestore, host, 8080)
  connectStorageEmulator(storage, host, 9199)
}
