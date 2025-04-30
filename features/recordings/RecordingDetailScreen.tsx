"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { View, ScrollView, StyleSheet } from "react-native"
import Slider from '@react-native-community/slider';
import { Text, Card, Divider, ActivityIndicator, Button, IconButton } from "react-native-paper"
import { Audio, AVPlaybackStatus } from "expo-av"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RecordingsStackParamList } from "../../navigation/MainNavigator"
import { useRecording } from "../../hooks/useRecordings"
import { formatDate, formatDuration } from "../../utils/dateFormatter"

type Props = NativeStackScreenProps<RecordingsStackParamList, "RecordingDetail">

interface PlayerState {
  playbackStatus: AVPlaybackStatus | null;
  position: number; // in seconds
  duration: number; // in seconds
  isPlaying: boolean;
  isLoadingAudio: boolean;
  audioError: string | null;
}

const initialPlayerState: PlayerState = {
  playbackStatus: null,
  position: 0,
  duration: 0,
  isPlaying: false,
  isLoadingAudio: false,
  audioError: null,
};

export default function RecordingDetailScreen({ route }: Props) {
  const { recordingId } = route.params
  const { data: recording, isLoading, isError } = useRecording(recordingId)

  const soundRef = useRef<Audio.Sound | null>(null)
  const [playerState, setPlayerState] = useState(initialPlayerState)
  const [retryCount, setRetryCount] = useState(0)

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    console.log('[onPlaybackStatusUpdate] Received status:', status)
    setPlayerState((prev) => ({ ...prev, playbackStatus: status }))

    if (!status.isLoaded) {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }))
      return
    }

    setPlayerState((prev) => ({ ...prev, isPlaying: status.isPlaying }))
    setPlayerState((prev) => ({
      ...prev,
      position: (status.positionMillis ?? 0) / 1000,
      // Only update duration if it's provided and greater than the current one (or initial 0)
      duration: (status.durationMillis ?? 0) > prev.duration ? (status.durationMillis ?? 0) / 1000 : prev.duration,
    }));

    if (status.didJustFinish) {
      setPlayerState((prev) => ({ ...prev, position: 0 }))
      soundRef.current?.setPositionAsync(0)
      setPlayerState((prev) => ({ ...prev, isPlaying: false }))
    }
  }

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current) return

    try {
      if (playerState.isPlaying) {
        await soundRef.current.pauseAsync()
      } else {
        await soundRef.current.playAsync()
      }
    } catch (error) {
      console.error("再生エラー:", error)
      setPlayerState((prev) => ({ ...prev, audioError: "音声の再生に失敗しました" }))
    }
  }, [playerState.isPlaying])

  const seekForward = async () => {
    if (!soundRef.current || !playerState.playbackStatus?.isLoaded) return

    try {
      const currentDurationMillis = playerState.playbackStatus.durationMillis ?? 0
      const currentPositionMillis = playerState.playbackStatus.positionMillis ?? 0
      const newPositionMillis = Math.min(currentPositionMillis + 10000, currentDurationMillis)
      await soundRef.current.setPositionAsync(newPositionMillis)
    } catch (error) {
      console.error("シークエラー:", error)
    }
  }

  const seekBackward = async () => {
    if (!soundRef.current || !playerState.playbackStatus?.isLoaded) return

    try {
      const currentPositionMillis = playerState.playbackStatus.positionMillis ?? 0
      const newPositionMillis = Math.max(currentPositionMillis - 10000, 0)
      await soundRef.current.setPositionAsync(newPositionMillis)
    } catch (error) {
      console.error("シークエラー:", error)
    }
  }

  const handleSlidingComplete = async (value: number) => {
    if (!soundRef.current || !playerState.playbackStatus?.isLoaded) return;
    try {
      // Slider の値は秒単位なので、ミリ秒に変換
      await soundRef.current.setPositionAsync(value * 1000);
      // ステータスを即時反映させるために getStatusAsync を呼び出す
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
         onPlaybackStatusUpdate(status);
      }
    } catch (error) {
      console.error("スライダーシークエラー:", error);
    }
  };

  useEffect(() => {
    let isMounted = true

    const loadAudio = async () => {
      if (!recording?.audioUrl) {
        console.log("[useEffect] No audio URL, skipping load.")
        return
      }

      console.log("[useEffect] Starting audio load for:", recording.audioUrl)
      setPlayerState((prev) => ({ ...prev, isLoadingAudio: true, audioError: null }))
      setPlayerState((prev) => ({ ...prev, isPlaying: false, position: 0, duration: 0, playbackStatus: null }))

      try {
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri: recording.audioUrl },
          { shouldPlay: false, progressUpdateIntervalMillis: 500 }
        )

        if (status.isLoaded) {
          setPlayerState((prev) => ({ ...prev, playbackStatus: status }))
          setPlayerState((prev) => ({
            ...prev,
            isPlaying: status.isPlaying,
            position: (status.positionMillis ?? 0) / 1000,
            duration: (status.durationMillis ?? 0) / 1000,
          }));
          console.log(`[useEffect] Initial pos=${status.positionMillis ?? 0}, dur=${status.durationMillis ?? 0}`);
          setPlayerState((prev) => ({ ...prev, audioError: null }))
        } else {
          throw new Error("[useEffect] createAsync succeeded but status.isLoaded is false.")
        }

        if (!isMounted) {
          console.log('[useEffect] Component unmounted after load but before ref/callback set, unloading.')
          await newSound.unloadAsync()
          return
        }

        soundRef.current = newSound
        console.log('[useEffect] Sound object stored in ref.')

        newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate)
        console.log('[useEffect] onPlaybackStatusUpdate callback set.')
      } catch (error) {
        console.error("[useEffect] Error loading audio:", error)
        if (isMounted) {
          setPlayerState((prev) => ({ ...prev, audioError: "音声ファイルの読み込みに失敗しました" }))
        }
      } finally {
        if (isMounted) {
          setPlayerState((prev) => ({ ...prev, isLoadingAudio: false }))
          console.log('[useEffect] setIsLoadingAudio: false')
        }
      }
    }

    loadAudio()

    return () => {
      isMounted = false
      console.log("[useEffect Cleanup] Unmounting component, unloading sound...")
      if (soundRef.current) {
        soundRef.current.unloadAsync()
        soundRef.current = null
      }
    }
  }, [recording?.audioUrl, retryCount])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    )
  }

  if (isError || !recording) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>データの読み込みに失敗しました。</Text>
        <Button mode="contained" style={styles.retryButton}>
          再試行
        </Button>
      </View>
    )
  }

  console.log(`[Render] Position: ${playerState.position}, Duration: ${playerState.duration}, isPlaying: ${playerState.isPlaying}, isLoadingAudio: ${playerState.isLoadingAudio}`)

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.phoneNumber}>{recording.phoneNumber}</Text>
          <Text style={styles.date}>{formatDate(recording.recordedAt)}</Text>

          <Divider style={styles.divider} />

          {/* 音声プレーヤー */}
          <View style={styles.playerContainer}>
            <Text style={styles.sectionTitle}>通話録音</Text>

            {playerState.isLoadingAudio ? (
              <ActivityIndicator size="small" style={styles.audioLoading} />
            ) : playerState.audioError ? (
              <View>
                <Text style={styles.audioError}>{playerState.audioError}</Text>
                <Button mode="outlined" onPress={() => setRetryCount(prev => prev + 1)} style={styles.retryButton}>
                  再読み込み
                </Button>
              </View>
            ) : recording.audioUrl ? (
              <View style={styles.playerControlsContainer} testID="player-controls">
                <View style={styles.buttonsRow}>
                  <IconButton icon="rewind-10" size={24} onPress={seekBackward} disabled={!soundRef.current || playerState.isLoadingAudio} accessibilityRole="button" accessibilityLabel="rewind-10" />
                  <IconButton icon={playerState.isPlaying ? "pause" : "play"} accessibilityRole="button" accessibilityLabel={playerState.isPlaying ? "pause" : "play"} size={36} onPress={togglePlayback} disabled={!soundRef.current || playerState.isLoadingAudio} style={styles.playButton} />
                  <IconButton icon="fast-forward-10" size={24} onPress={seekForward} disabled={!soundRef.current || playerState.isLoadingAudio} accessibilityRole="button" accessibilityLabel="fast-forward-10" />
                </View>

                <Slider style={styles.slider} minimumValue={0} maximumValue={playerState.duration > 0 ? playerState.duration : 1} value={playerState.position} onSlidingComplete={handleSlidingComplete} disabled={!soundRef.current || playerState.isLoadingAudio || playerState.duration <= 0} minimumTrackTintColor="#007AFF" maximumTrackTintColor="#D3D3D3" thumbTintColor="#007AFF" testID="audio-slider" />
                <Text style={styles.duration} testID="current-time-display">{formatDuration(playerState.position)}</Text>
                <Text style={styles.duration} testID="total-duration-display"> / {formatDuration(playerState.duration)}</Text>
              </View>
            ) : (
              <Text style={styles.noAudio}>音声ファイルがありません</Text>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* 文字起こし */}
          <View style={styles.transcriptContainer}>
            <Text style={styles.sectionTitle}>文字起こし</Text>
            {recording.transcript ? (
              <Text style={styles.transcript}>{recording.transcript}</Text>
            ) : (
              <Text style={styles.noContent}>文字起こしがありません</Text>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* 要約 */}
          <View style={styles.summaryContainer}>
            <Text style={styles.sectionTitle}>要約</Text>
            {recording.summary ? (
              <Text style={styles.summary}>{recording.summary}</Text>
            ) : (
              <Text style={styles.noContent}>要約がありません</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  card: {
    margin: 8,
    elevation: 2,
  },
  phoneNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  date: {
    fontSize: 16,
    color: "#757575",
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  playerContainer: {
    marginVertical: 8,
  },
  audioLoading: {
    marginVertical: 20,
  },
  audioError: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  playerControlsContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  playButton: {
    marginHorizontal: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 5,
  },
  noAudio: {
    color: "#757575",
    fontStyle: "italic",
    textAlign: "center",
    marginVertical: 16,
  },
  transcriptContainer: {
    marginVertical: 8,
  },
  transcript: {
    fontSize: 16,
    lineHeight: 24,
  },
  summaryContainer: {
    marginVertical: 8,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
  },
  noContent: {
    color: "#757575",
    fontStyle: "italic",
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    color: "#B00020",
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 8,
  },
})
