"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { View, ScrollView, StyleSheet } from "react-native"
import Slider from '@react-native-community/slider';
import { Text, Card, Divider, ActivityIndicator, Button, IconButton } from "react-native-paper"
import { Audio, AVPlaybackStatus } from "expo-av"
import { useLocalSearchParams } from "expo-router" // Import useLocalSearchParams
// Remove NativeStackScreenProps and RecordingsStackParamList imports
// import type { NativeStackScreenProps } from "@react-navigation/native-stack"
// import type { RecordingsStackParamList } from "../../navigation/MainNavigator"
import { useRecording } from "../../hooks/useRecordings" // Adjust path if needed
import { formatDate, formatDuration } from "../../utils/dateFormatter" // Adjust path if needed

// Remove Props type definition
// type Props = NativeStackScreenProps<RecordingsStackParamList, "RecordingDetail">

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

// Remove route prop from function signature
export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // Get id from URL params
  const recordingId = id; // Assign id to recordingId

  // Ensure recordingId is defined before using it
  if (!recordingId) {
      // Handle the case where id is not available, e.g., show an error or return null
      return (
          <View style={styles.errorContainer}>
              <Text style={styles.errorText}>録音IDが見つかりません。</Text>
          </View>
      );
  }

  const { data: recording, isLoading, isError } = useRecording(recordingId)

  const soundRef = useRef<Audio.Sound | null>(null)
  const [playerState, setPlayerState] = useState(initialPlayerState)
  const [retryCount, setRetryCount] = useState(0)

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    // console.log('[onPlaybackStatusUpdate] Received status:', status) // Keep for debugging if needed

    if (!status.isLoaded) {
      // Handle unloaded status, maybe set error or specific state
      setPlayerState((prev) => ({ ...prev, isPlaying: false }))
      return
    }

    // Use functional update to ensure we have the latest state
    setPlayerState(prev => {
      const newDurationMillis = status.durationMillis;
      const validDuration = (newDurationMillis && Number.isFinite(newDurationMillis)) ? newDurationMillis / 1000 : 0;

      return {
        ...prev,
        playbackStatus: status, // Store the whole status object
        position: (status.positionMillis ?? 0) / 1000,
        duration: validDuration, // Use validated duration
        isPlaying: status.isPlaying,
      }
    });

    // Log duration changes specifically
    console.log(`[onPlaybackStatusUpdate] Duration: ${playerState.duration}`);

    if (status.didJustFinish) {
      setPlayerState((prev) => ({ ...prev, position: 0 }))
      soundRef.current?.setPositionAsync(0)
      setPlayerState((prev) => ({ ...prev, isPlaying: false }))
    }
  }, [playerState.duration])

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

    // Check if the value is finite before proceeding
    if (!Number.isFinite(value)) {
      console.error("Slider seek error: received non-finite value:", value);
      return;
    }

    try {
      // Slider value is in seconds, convert to milliseconds
      await soundRef.current.setPositionAsync(value * 1000);
      // Status will be updated by onPlaybackStatusUpdate callback
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
            // Ensure duration is 0 if NaN or null
            duration: (status.durationMillis && Number.isFinite(status.durationMillis)) ? status.durationMillis / 1000 : 0,
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
        {/* Optionally add a retry button or more info */}
      </View>
    )
  }

  const handleRetryLoadAudio = () => {
    setRetryCount(prev => prev + 1);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Card style={styles.card}>
        <Card.Title title="録音詳細" subtitle={`電話番号: ${recording.phoneNumber}`} />
        <Card.Content>
          <Text style={styles.detailText}>録音日時: {formatDate(recording.recordedAt)}</Text>
          {/* Display duration if available */}
          {playerState.duration > 0 && (
            <Text style={styles.detailText}>録音時間: {formatDuration(playerState.duration)}</Text>
          )}
        </Card.Content>
      </Card>

      {recording.audioUrl && (
        <Card style={styles.card}>
          <Card.Title title="音声再生" />
          <Card.Content>
            {playerState.isLoadingAudio ? (
              <View style={styles.playerLoading}>
                <ActivityIndicator size="small" />
                <Text style={styles.playerText}>音声を読み込み中...</Text>
              </View>
            ) : playerState.audioError ? (
              <View style={styles.playerError}>
                <Text style={styles.errorText}>{playerState.audioError}</Text>
                <Button mode="outlined" onPress={handleRetryLoadAudio} style={styles.retryButton}>
                   再試行
                </Button>
              </View>
            ) : playerState.playbackStatus?.isLoaded ? (
              <>
                <View style={styles.controls}>
                  <IconButton icon="skip-previous" size={30} onPress={seekBackward} />
                  <IconButton
                    icon={playerState.isPlaying ? "pause" : "play"}
                    size={40}
                    onPress={togglePlayback}
                  />
                  <IconButton icon="skip-next" size={30} onPress={seekForward} />
                </View>
                {/* Only render slider if duration is valid */}
                {playerState.duration > 0 ? (
                  <View style={styles.sliderContainer}>
                      <Text style={styles.timeText}>{formatDuration(playerState.position)}</Text>
                      <Slider
                          style={styles.slider}
                          minimumValue={0}
                          maximumValue={playerState.duration}
                          value={playerState.position}
                          onSlidingComplete={handleSlidingComplete}
                          minimumTrackTintColor="#2196F3"
                          maximumTrackTintColor="#BDBDBD"
                          thumbTintColor="#2196F3"
                      />
                      <Text style={styles.timeText}>{formatDuration(playerState.duration)}</Text>
                  </View>
                ) : (
                  // Optionally show a loading or placeholder state for the slider area
                  <View style={styles.sliderPlaceholder} />
                )}
              </>
            ) : (
               <Text style={styles.playerText}>再生準備完了</Text> // Or another initial state message
            )}
          </Card.Content>
        </Card>
      )}

      {recording.summary && (
        <Card style={styles.card}>
          <Card.Title title="要約" />
          <Card.Content>
            <Text style={styles.summaryText}>{recording.summary}</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  contentContainer: {
     padding: 8,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  detailText: {
    fontSize: 16,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
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
    marginBottom: 8,
  },
  playerLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
  },
  playerError: {
      alignItems: 'center',
      padding: 10,
  },
  playerText: {
      marginLeft: 8,
      fontSize: 16,
  },
  retryButton: {
      marginTop: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  sliderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%', // Ensure container takes full width
  },
  slider: {
    flex: 1, // Allow slider to take available space
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
      fontSize: 14,
      color: '#666',
      width: 50, // Fixed width to prevent layout shifts
      textAlign: 'center',
  },
  sliderPlaceholder: {
    height: 40, // Match slider container height approx
    // Add any styles for placeholder, e.g., a subtle background or indicator
  }
});