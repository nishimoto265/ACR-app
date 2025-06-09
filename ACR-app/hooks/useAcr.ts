import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { processAllRecordings, pollProcessingStatus } from '../services/api';
import type { ProcessAllResponse, PollResponse } from '../services/api';
import { useToast } from './use-toast';

interface AcrProcessingState {
  isProcessing: boolean;
  progress: {
    toProcess: number;
    processed: number;
  } | null;
  error: string | null;
  lastPollToken?: string;
}

/**
 * ACR音声処理サービスとの通信を管理するカスタムフック
 */
export function useAcr() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AcrProcessingState>({
    isProcessing: false,
    progress: null,
    error: null,
    lastPollToken: undefined,
  });

  // ポーリングタイマーの状態
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // 変更をポーリング
  const pollChanges = useCallback(async () => {
    try {
      const response = await pollProcessingStatus(state.lastPollToken);
      
      if (response.polled > 0) {
        // ファイルが処理された場合は recordingsクエリを無効化して再取得を促す
        queryClient.invalidateQueries({ queryKey: ['recordings'] });
        
        toast({
          title: `${response.polled}件の録音データを更新しました`,
          variant: 'default',
        });
        
        // 次回のポーリングのためにトークンを保存（あれば）
        if (response.startPageToken) {
          setState(prev => ({ ...prev, lastPollToken: response.startPageToken }));
        }
      }
    } catch (error) {
      console.error('ポーリングエラー:', error);
      // ポーリングエラーではトーストを表示せず、コンソールのみに記録
    }
  }, [state.lastPollToken, queryClient, toast]);

  // ポーリングを開始
  const startPolling = useCallback(() => {
    // すでにポーリング中なら何もしない
    if (pollingInterval) return;

    const interval = setInterval(pollChanges, 5000); // 5秒間隔でポーリング
    setPollingInterval(interval);
  }, [pollingInterval, pollChanges]);

  // ポーリングを停止
  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // 全録音データの処理を開始
  const processAll = useCallback(async () => {
    if (state.isProcessing) {
      toast({
        title: 'すでに処理が進行中です',
        variant: 'default',
      });
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const response = await processAllRecordings();
      
      setState(prev => ({
        ...prev,
        progress: {
          toProcess: response.to_process,
          processed: response.processed,
        },
      }));

      // 成功トースト表示
      toast({
        title: `処理開始: ${response.processed}/${response.to_process}件`,
        variant: 'default',
      });

      // 処理が必要なファイルがあれば、ポーリングを開始
      if (response.to_process > 0) {
        startPolling();
      } else {
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
      setState(prev => ({ ...prev, isProcessing: false, error: errorMessage }));
      toast({
        title: '録音データの取り込みに失敗しました',
        variant: 'destructive',
      });
      console.error('録音データ処理エラー:', error);
    }
  }, [state.isProcessing, toast, startPolling]);

  // クリーンアップ関数
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return {
    processAll,
    isProcessing: state.isProcessing,
    progress: state.progress,
    error: state.error,
    startPolling,
    stopPolling,
  };
} 