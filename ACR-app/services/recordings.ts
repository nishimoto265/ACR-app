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
import { db } from "./firebase"
// Import Timestamp class for instanceof check
import { Timestamp as FirebaseTimestamp } from "firebase/firestore"

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

// Firestoreのタイムスタンプをデータに変換 (nullチェック追加)
const convertTimestamp = (timestamp: unknown): Date | null => {
  if (timestamp instanceof FirebaseTimestamp) {
    return timestamp.toDate();
  }
  console.warn('Invalid timestamp type received:', timestamp);
  return null; // Return null if not a valid Timestamp
}

// Firestoreドキュメントを型付きオブジェクトに変換 (nullチェックと警告追加)
const convertRecording = (doc: QueryDocumentSnapshot<DocumentData>): Recording | null => {
  const data = doc.data();
  const recordedAtDate = convertTimestamp(data.recordedAt);
  const createdAtTimestamp = data.createdAt instanceof FirebaseTimestamp ? data.createdAt : null;

  if (!recordedAtDate) {
    console.warn(`Skipping recording ${doc.id} due to invalid 'recordedAt' timestamp.`);
    return null; // Skip this record if recordedAt is invalid
  }
  if (!createdAtTimestamp) {
    console.warn(`Invalid or missing 'createdAt' timestamp for doc ${doc.id}. Using current server time estimate.`);
    // createdAtTimestamp = FirebaseTimestamp.now(); // Option: Use server timestamp estimate
    // For now, we'll allow it but it might cause issues depending on usage.
    // If createdAt is strictly required, uncomment the line above or return null here too.
  }

  return {
    id: doc.id,
    phoneNumber: data.phoneNumber || "",
    recordedAt: recordedAtDate, // Use the safely converted date
    duration: typeof data.duration === 'number' ? data.duration : 0,
    transcript: data.transcript || "",
    summary: data.summary || "",
    fileName: data.fileName || "",
    status: data.status || "",
    // Use the checked timestamp, or default if it was invalid but allowed
    createdAt: createdAtTimestamp || FirebaseTimestamp.now(), // Provide a default if null but allowed
    audioUrl: data.audioUrl || undefined, // Handle potentially missing audioUrl
  }
}

// 録音一覧を取得 (変換失敗したものを除外)
export const getRecordings = async (limitCount = 20): Promise<Recording[]> => {
  try {
    const q = query(collection(db, "recordings"), orderBy("recordedAt", "desc"), limit(limitCount))

    const querySnapshot = await getDocs(q)
    // Map documents, filter out nulls (conversion failures)
    const recordings = querySnapshot.docs
      .map(convertRecording)
      .filter((rec): rec is Recording => rec !== null); // Type guard to ensure only valid Recordings remain
    return recordings;
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
      // Convert the single document safely
      const convertedData = convertRecording(docSnap);
      if (!convertedData) {
        console.error(`Failed to convert document data for ID: ${recordingId}`);
        return null;
      }

      // Get audio URL (assuming audioUrl is part of the converted data or needs separate handling)
      // The previous logic for audioUrl seemed a bit complex; let's simplify based on convertRecording
      const audioUrl = convertedData.audioUrl; // Use the potentially undefined URL from conversion
      // Optional: If audioUrl is strictly needed, add check here
      // if (!audioUrl) {
      //   throw new Error("Audio URL missing after conversion.");
      // }

      // Return the full recording data including the potentially undefined audioUrl
      return { ...convertedData, audioUrl }; // Ensure audioUrl is included

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
    // Map and filter results safely
    const phoneResults = phoneQuerySnapshot.docs
      .map(convertRecording)
      .filter((rec): rec is Recording => rec !== null);

    // 要約での検索（完全一致ではなく部分一致）
    // 注意: Firestoreは部分一致検索に対応していないため、実際の実装ではCloud Functionsや
    // Algoliaなどの外部検索サービスを使用することが推奨されます

    return phoneResults
  } catch (error) {
    console.error("録音データの検索に失敗しました:", error)
    throw error
  }
}
