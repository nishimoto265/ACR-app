import { useQuery } from "react-query"
import { getRecordings, getRecording, searchRecordings } from "../services/recordings"

// 録音一覧を取得するフック  getRecording, searchRecordings, Recording } from '../services/recordings';

// 録音一覧を取得するフック
export function useRecordings(limitCount = 20) {
  return useQuery(["recordings", limitCount], () => getRecordings(limitCount), {
    staleTime: 5 * 60 * 1000, // 5分
  })
}

// 録音詳細を取得するフック
export function useRecording(recordingId: string) {
  return useQuery(["recording", recordingId], () => getRecording(recordingId), {
    enabled: !!recordingId,
    staleTime: 5 * 60 * 1000, // 5分
  })
}

// 録音データを検索するフック
export function useSearchRecordings(searchTerm: string, limitCount = 20) {
  return useQuery(["recordings", "search", searchTerm, limitCount], () => searchRecordings(searchTerm, limitCount), {
    enabled: !!searchTerm && searchTerm.length > 0,
    staleTime: 5 * 60 * 1000, // 5分
  })
}
