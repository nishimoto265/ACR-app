import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
} from "firebase/firestore"
import { db, storage } from "./firebase"

export interface Recording {
  id: string
  phoneNumber: string
  recordedAt: Date
  duration: number
  audioUrl?: string
  transcript?: string
  summary?: string
  fileName: string
  status: string
  createdAt: Timestamp
}

// Firestoreのタイムスタンプをデータに変換
const convertTimestamp = (timestamp: Timestamp): Date => {
  return timestamp.toDate()
}

// Firestoreドキュメントを型付きオブジェクトに変換
const convertRecording = (doc: QueryDocumentSnapshot<DocumentData>): Recording => {
  const data = doc.data()
  return {
    id: doc.id,
    phoneNumber: data.phoneNumber || "",
    recordedAt: data.recordedAt ? convertTimestamp(data.recordedAt) : new Date(),
    duration: data.duration || 0,
    transcript: data.transcript || "",
    summary: data.summary || "",
    fileName: data.fileName || "",
    status: data.status || "",
    createdAt: data.createdAt,
  }
}

// 録音一覧を取得
export const getRecordings = async (limitCount = 20): Promise<Recording[]> => {
  try {
    const q = query(collection(db, "recordings"), orderBy("recordedAt", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(convertRecording)
  } catch (error) {
    console.error("録音一覧の取得に失敗しました:", error)
    throw error
  }
}

// 録音詳細を取得
export const getRecording = async (recordingId: string): Promise<Recording | null> => {
  try {
    console.log(`Fetching recording data for ID: ${recordingId}`)
    const docRef = doc(db, "recordings", recordingId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      console.log("Document data fetched:", docSnap.data())
      const data = docSnap.data()

      // Directly use the audioUrl stored in Firestore
      const audioUrl = data.audioUrl
      if (!audioUrl) {
        console.error("Audio URL not found in the document data.")
        // Returning data without audioUrl might be acceptable depending on UI handling
        // return { id: docSnap.id, ...data } as Recording;
        throw new Error("Audio URL not found in Firestore document.")
      }
      console.log(`Using audio URL from Firestore: ${audioUrl}`)

      // Return the full recording data including the audioUrl
      return { id: docSnap.id, ...data, audioUrl } as Recording

    } else {
      console.log("No such document!")
      return null
    }
  } catch (error) {
    console.error("Error getting recording:", error)
    // Log the specific error if it's a Firebase Storage error
    if (error instanceof Error && "code" in error) {
      console.error(`Firebase Error Code: ${error.code}`)
    }
    throw error // Re-throw the error to be caught by react-query
  }
}

// 録音データを検索
export const searchRecordings = async (searchTerm: string, limitCount = 20): Promise<Recording[]> => {
  try {
    // 電話番号での検索
    const phoneQuery = query(
      collection(db, "recordings"),
      where("phoneNumber", ">=", searchTerm),
      where("phoneNumber", "<=", searchTerm + "\uf8ff"),
      limit(limitCount),
    )

    const phoneQuerySnapshot = await getDocs(phoneQuery)
    const phoneResults = phoneQuerySnapshot.docs.map(convertRecording)

    // 要約での検索（完全一致ではなく部分一致）
    // 注意: Firestoreは部分一致検索に対応していないため、実際の実装ではCloud Functionsや
    // Algoliaなどの外部検索サービスを使用することが推奨されます

    return phoneResults
  } catch (error) {
    console.error("録音データの検索に失敗しました:", error)
    throw error
  }
}
