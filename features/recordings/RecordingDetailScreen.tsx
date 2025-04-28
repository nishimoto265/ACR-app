"use client"

import { useState, useEffect } from "react"
import { View, ScrollView, StyleSheet } from "react-native"
import { Text, Card, Divider, ActivityIndicator, Button, IconButton } from "react-native-paper"
import { Audio } from "expo-av"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RecordingsStackParamList } from "../../navigation/MainNavigator"
import { useRecording } from "../../hooks/useRecordings"
import { formatDate, formatDuration } from "../../utils/dateFormatter"

type Props = NativeStackScreenProps<RecordingsStackParamList, "RecordingDetail">

export default function RecordingDetailScreen({ route }: Props) {
  const { recordingId } = route.params
  const { data: recording, isLoading, isError } = useRecording(recordingId)

  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  // 音声ファイルの読み込み
  const loadAudio = async () => {
    if (!recording?.audioUrl) return

    try {
      setIsLoadingAudio(true)
      setAudioError(null)

      // 既存のサウンドをアンロード
      if (sound) {
        await sound.unloadAsync()
      }

      // 新しいサウンドをロード
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recording.audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate,
      )

      setSound(newSound)
    } catch (error) {
      console.error("音声ファイルの読み込みに失敗しました:", error)
      setAudioError("音声ファイルの読み込みに失敗しました")
    } finally {
      setIsLoadingAudio(false)
    }
  }

  // 再生状態の更新ハンドラ
  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (!status.isLoaded) return

    setIsPlaying(status.isPlaying)

    if (status.positionMillis) {
      setPosition(status.positionMillis / 1000)
    }

    if (status.durationMillis) {
      setDuration(status.durationMillis / 1000)
    }
  }

  // 再生/一時停止の切り替え
  const togglePlayback = async () => {
    if (!sound) return

    try {
      if (isPlaying) {
        await sound.pauseAsync()
      } else {
        await sound.playAsync()
      }
    } catch (error) {
      console.error("再生エラー:", error)
      setAudioError("音声の再生に失敗しました")
    }
  }

  // 再生位置のシーク
  const seekForward = async () => {
    if (!sound) return

    try {
      const newPosition = Math.min(position + 10, duration)
      await sound.setPositionAsync(newPosition * 1000)
    } catch (error) {
      console.error("シークエラー:", error)
    }
  }

  const seekBackward = async () => {
    if (!sound) return

    try {
      const newPosition = Math.max(position - 10, 0)
      await sound.setPositionAsync(newPosition * 1000)
    } catch (error) {
      console.error("シークエラー:", error)
    }
  }

  // コンポーネントのマウント時に音声をロード
  useEffect(() => {
    if (recording?.audioUrl) {
      loadAudio()
    }

    // クリーンアップ関数
    return () => {
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [recording])

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

            {isLoadingAudio ? (
              <ActivityIndicator size="small" style={styles.audioLoading} />
            ) : audioError ? (
              <View>
                <Text style={styles.audioError}>{audioError}</Text>
                <Button mode="outlined" onPress={loadAudio} style={styles.retryButton}>
                  再読み込み
                </Button>
              </View>
            ) : recording.audioUrl ? (
              <View style={styles.playerControls}>
                <IconButton icon="rewind-10" size={24} onPress={seekBackward} disabled={!sound} />
                <IconButton
                  icon={isPlaying ? "pause" : "play"}
                  size={36}
                  onPress={togglePlayback}
                  disabled={!sound}
                  style={styles.playButton}
                />
                <IconButton icon="fast-forward-10" size={24} onPress={seekForward} disabled={!sound} />
                <Text style={styles.duration}>
                  {formatDuration(position)} / {formatDuration(duration)}
                </Text>
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
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  playButton: {
    marginHorizontal: 8,
  },
  duration: {
    marginLeft: 8,
    fontSize: 14,
    color: "#757575",
  },
  audioLoading: {
    marginVertical: 16,
  },
  audioError: {
    color: "#B00020",
    marginVertical: 8,
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
