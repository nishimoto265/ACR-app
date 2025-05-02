// ACR音声処理サービスとの通信を担当するAPIクライアント

// 開発環境ではプロキシサーバー経由でアクセス
const ACR_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://acr-3-148163978225.asia-northeast2.run.app';

// タイムアウト付きのフェッチ関数
const fetchWithTimeout = async (
  url: string, 
  options: RequestInit, 
  timeout: number = 60000
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`リクエストがタイムアウトしました (${timeout}ms)`);
    }
    // Connection refusedエラーをより明確に
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`サーバー接続エラー: ${url}`, error);
      throw new Error(`サーバー接続エラー: プロキシサーバーが起動していないか、ネットワーク接続に問題があります`);
    }
    throw error;
  }
};

/**
 * ACR APIに対してHTTPリクエストを送信する共通関数
 * @param path APIのパス（/process_allなど）
 * @param body リクエストボディ（オブジェクト）
 * @returns レスポンスをJSONとして返す
 */
export async function callAcr<T>(
  path: string, 
  body: object = {}, 
  timeout: number = 60000
): Promise<T> {
  try {
    const res = await fetchWithTimeout(
      `${ACR_BASE_URL}${path}`, 
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        credentials: 'omit', // クッキーを送信しない
      },
      timeout
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'レスポンステキストの取得に失敗しました');
      throw new Error(`API呼び出しエラー (${res.status}): ${path} - ${errorText}`);
    }

    return res.json() as Promise<T>;
  } catch (error) {
    console.error('API呼び出し中にエラーが発生しました:', error);
    throw error;
  }
}

// レスポンス型定義
export interface ProcessAllResponse {
  to_process: number;
  processed: number;
}

export interface PollResponse {
  polled: number;
  startPageToken?: string;
}

export interface WebhookResponse {
  ok: boolean;
}

/**
 * 全ての未処理録音データを処理キューに追加
 * @returns 処理対象数と処理済み数を含むレスポンス
 */
export async function processAllRecordings(): Promise<ProcessAllResponse> {
  return callAcr<ProcessAllResponse>('/process_all', {});
}

/**
 * 処理状況を確認する
 * @param startPageToken オプションのページトークン
 * @returns ポーリング結果
 */
export async function pollProcessingStatus(startPageToken?: string): Promise<PollResponse> {
  const body = startPageToken ? { startPageToken } : {};
  return callAcr<PollResponse>('/poll', body);
}

/**
 * Webhookエンドポイントを呼び出す（主にテスト用）
 * @param fileId ファイルID
 * @param fileName ファイル名
 * @returns 処理結果
 */
export async function triggerWebhook(fileId: string, fileName: string): Promise<WebhookResponse> {
  return callAcr<WebhookResponse>('/webhook', { fileId, fileName });
} 