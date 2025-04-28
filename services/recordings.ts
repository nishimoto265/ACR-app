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
import { ref, getDownloadURL } from "firebase/storage"
import { firestore, storage } from "./firebase"

export interface Recording {
  id: string
  phoneNumber: string
  recordedAt: Date
  duration: number
  audioUrl?: string
  transcript?: string
  summary?: string
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
  }
}

// 録音一覧を取得
export const getRecordings = async (limitCount = 20): Promise<Recording[]> => {
  try {
    const q = query(collection(firestore, "recordings"), orderBy("recordedAt", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(convertRecording)
  } catch (error) {
    console.error("録音一覧の取得に失敗しました:", error)
    throw error
  }
}

// 録音詳細を取得
export const getRecording = async (recordingId: string): Promise<Recording> => {
  try {
    const docRef = doc(firestore, "recordings", recordingId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error("録音データが見つかりません")
    }

    const recording = convertRecording(docSnap as QueryDocumentSnapshot<DocumentData>)

    // 音声ファイルのURLを取得
    try {
      const audioRef = ref(storage, `recordings/${recordingId}.mp3`)
      const audioUrl = await getDownloadURL(audioRef)
      recording.audioUrl = audioUrl
    } catch (audioError) {
      console.error("音声ファイルの取得に失敗しました:", audioError)
      // 音声ファイルが取得できなくても処理を続行
    }

    return recording
  } catch (error) {
    console.error("録音詳細の取得に失敗しました:", error)
    throw error
  }
}

// 録音データを検索
export const searchRecordings = async (searchTerm: string, limitCount = 20): Promise<Recording[]> => {
  try {
    // 電話番号での検索
    const phoneQuery = query(
      collection(firestore, "recordings"),
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
