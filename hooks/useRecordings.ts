import { useQuery } from "@tanstack/react-query"
import { getRecordings, getRecording, searchRecordings } from "../services/recordings"

// 録音一覧を取得するフック
export function useRecordings(limitCount = 20) {
  return useQuery({
    queryKey: ["recordings", limitCount],
    queryFn: () => getRecordings(limitCount),
    staleTime: 5 * 60 * 1000, // 5分
  })
}

// 録音詳細を取得するフック
export function useRecording(recordingId: string) {
  return useQuery({
    queryKey: ["recording", recordingId],
    queryFn: () => getRecording(recordingId),
    enabled: !!recordingId,
    staleTime: 5 * 60 * 1000, // 5分
  })
}

// 録音データを検索するフック
export function useSearchRecordings(searchTerm: string, limitCount = 20) {
  return useQuery({
    queryKey: ["recordings", "search", searchTerm, limitCount],
    queryFn: () => searchRecordings(searchTerm, limitCount),
    enabled: !!searchTerm && searchTerm.length > 0,
    staleTime: 5 * 60 * 1000, // 5分
  })
}
