"use client"

import { useState, useEffect, useCallback, useRef, useContext } from "react"
import { View, ScrollView, StyleSheet } from "react-native"
import Slider from '@react-native-community/slider';
import { Text, Card, Divider, ActivityIndicator, IconButton, useTheme as usePaperTheme } from "react-native-paper"
import { Audio, AVPlaybackStatus } from "expo-av"
import { useLocalSearchParams, useFocusEffect } from "expo-router" // Correct hook for Expo Router
// Adjust import paths due to moving the file
import { useRecording } from "../../../hooks/useRecordings" 
import { formatDate, formatDuration } from "../../../utils/dateFormatter" 
import { ThemeContext } from "../../_layout"; // Import ThemeContext from root layout
// import { useContext } from "react"; // Import useContext

// Removed navigation-related types and props

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

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // Get id from URL params
  const recordingId = id; 
  
  // テーマコンテキストを使用
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const isDarkMode = themeContext?.isDarkMode || false;
  
  // Use hardcoded colors instead of theme context to avoid import issues
  const colors = {
    primary: "#03A9F4",
    onPrimary: "#FFFFFF",
    secondary: "#03A9F4",
    onSecondary: "#FFFFFF",
    background: theme?.colors.background || "#FFFFFF",
    surface: theme?.colors.surface || "#FFFFFF",
    onSurface: isDarkMode ? "#FFFFFF" : "#000000",
    outline: isDarkMode ? "#FFFFFF" : "#BDBDBD"
  };
 
  const paperTheme = usePaperTheme(); // Use paper's theme hook if needed for specific defaults

  // --- Hooks called unconditionally at the top level --- 
  const soundRef = useRef<Audio.Sound | null>(null)
  const [playerState, setPlayerState] = useState(initialPlayerState)

  // recordingId might be undefined initially, use ! or ensure hook handles undefined
  const { data: recording, isLoading, isError } = useRecording(recordingId!); 

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }

    setPlayerState(prev => {
      const newDurationMillis = status.durationMillis;
      const validDuration = (newDurationMillis && Number.isFinite(newDurationMillis)) ? newDurationMillis / 1000 : prev.duration; // Keep old duration if new one invalid
      const newPositionMillis = status.positionMillis ?? 0;
      
      return {
        ...prev,
        playbackStatus: status, 
        position: newPositionMillis / 1000,
        duration: validDuration,
        isPlaying: status.isPlaying,
      };
    });

    if (status.didJustFinish) {
      soundRef.current?.setPositionAsync(0).then(() => {
         setPlayerState((prev) => ({ ...prev, position: 0, isPlaying: false }));
      });
    }
  }, []); // Dependency array is empty as it doesn't depend on component state/props

  const togglePlayback = useCallback(async () => {
    if (!soundRef.current || !playerState.playbackStatus?.isLoaded) return; // Check status loaded

    try {
      if (playerState.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
      // isPlaying state is updated via onPlaybackStatusUpdate
    } catch (error) {
      console.error("再生/一時停止エラー:", error);
      setPlayerState((prev) => ({ ...prev, audioError: "音声の操作に失敗しました" }));
    }
  }, [playerState.isPlaying, playerState.playbackStatus?.isLoaded]); // Added dependency

  const seekForward = useCallback(async () => {
    if (!soundRef.current || !playerState.playbackStatus?.isLoaded) return;
    try {
      const currentPositionMillis = playerState.position * 1000; // Use state position
      const durationMillis = playerState.duration * 1000; // Use state duration
      const newPositionMillis = Math.min(currentPositionMillis + 10000, durationMillis);
      await soundRef.current.setPositionAsync(newPositionMillis);
    } catch (error) {
      console.error("前方シークエラー:", error);
    }
  }, [playerState.position, playerState.duration, playerState.playbackStatus?.isLoaded]); // Added dependencies

  const seekBackward = useCallback(async () => {
    if (!soundRef.current || !playerState.playbackStatus?.isLoaded) return;
    try {
      const currentPositionMillis = playerState.position * 1000;
      const newPositionMillis = Math.max(currentPositionMillis - 10000, 0);
      await soundRef.current.setPositionAsync(newPositionMillis);
    } catch (error) {
      console.error("後方シークエラー:", error);
    }
  }, [playerState.position, playerState.playbackStatus?.isLoaded]); // Added dependencies

  const handleSlidingComplete = useCallback(async (value: number) => {
    if (!soundRef.current || !playerState.playbackStatus?.isLoaded || !Number.isFinite(value)) return;
    try {
      await soundRef.current.setPositionAsync(value * 1000);
    } catch (error) {
      console.error("スライダーシークエラー:", error);
    }
  }, [playerState.playbackStatus?.isLoaded]); // Added dependency

  // --- Focus Effect for Cleanup --- 
  useFocusEffect(
    useCallback(() => {
      // This effect runs when the screen comes into focus.
      // We don't need to do anything on focus here, 
      // as audio loading is handled by the useEffect below.
      
      // Return the cleanup function to run when the screen loses focus.
      return () => {
        if (soundRef.current) {
          console.log("[Audio Cleanup - Focus] Screen blurred. Unloading sound.");
          try {
            // Don't await here, as cleanup should be fast
            soundRef.current.unloadAsync(); 
            soundRef.current = null; 
          } catch (error) {
            console.error("[Audio Cleanup - Focus] Error unloading sound:", error);
          }
        }
      };
    }, []) // Empty dependency array: effect runs on focus/blur
  );

  // Effect to load audio when recording data is available
  useEffect(() => {
    let isMounted = true;
    const loadAudio = async () => {
      // If recordingId is missing, audioUrl will be undefined too.
      if (!recording?.audioUrl) return;

      // Unload previous sound if exists
      if (soundRef.current) {
        console.log("[Audio Load] Unloading previous sound.");
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      setPlayerState({ ...initialPlayerState, isLoadingAudio: true }); // Reset state, set loading

      try {
        console.log("[Audio Load] Creating sound:", recording.audioUrl);
        const { sound: newSound, status } = await Audio.Sound.createAsync(
          { uri: recording.audioUrl },
          { shouldPlay: false, progressUpdateIntervalMillis: 500 }
        );

        if (!isMounted) {
          await newSound.unloadAsync();
          return;
        }

        if (!status.isLoaded) {
           throw new Error("Audio loaded but status.isLoaded is false.");
        }

        soundRef.current = newSound;
        newSound.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);

        setPlayerState(prev => ({
          ...prev,
          playbackStatus: status,
          position: (status.positionMillis ?? 0) / 1000,
          duration: (status.durationMillis && Number.isFinite(status.durationMillis)) ? status.durationMillis / 1000 : 0,
          isPlaying: status.isPlaying,
          isLoadingAudio: false, // Loading finished
          audioError: null,
        }));
         console.log("[Audio Load] Success.");

      } catch (error) {
        console.error("[Audio Load] Error:", error);
        if (isMounted) {
          setPlayerState(prev => ({ 
            ...prev, 
            audioError: "音声ファイルの読み込みに失敗しました", 
            isLoadingAudio: false 
          }));
        }
      }
    };

    // Ensure recordingId exists before loading audio
    if (!recordingId) return;
    loadAudio();

    // Cleanup function to unload sound when component unmounts or recording changes
    return () => {
      isMounted = false;
      console.log("[Audio Cleanup - Unmount] Unmounting or recording changed. Unloading sound.");
      if (soundRef.current) {
        try {
          // Don't necessarily need to wait for unload on unmount
          soundRef.current.unloadAsync(); 
          soundRef.current = null; 
        } catch (error) {
          console.error("[Audio Cleanup - Unmount] Error unloading sound:", error);
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording?.audioUrl, recordingId, onPlaybackStatusUpdate]); // Added recordingId and onPlaybackStatusUpdate


  // --- Early return moved after hooks ---
  if (!recordingId) {
      // This path should technically not be reached if routing works correctly
      return (
          <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
              <Text style={styles.errorText}>録音IDが見つかりません。</Text>
          </View>
      );
  }

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" />
        <Text style={styles.statusText}>録音データを読み込み中...</Text>
      </View>
    )
  }

  if (isError || !recording) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>録音データの読み込みに失敗しました</Text>
        {/* Optional: Add a retry button */}
      </View>
    )
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.card}>
        {/* Use createdAt for the subtitle */}
        <Card.Title 
          title={recording.phoneNumber || "不明な番号"} 
          subtitle={formatDate(recording.createdAt.toDate())} 
          titleStyle={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
          subtitleStyle={{ color: isDarkMode ? "#BBBBBB" : "#757575" }}
          theme={{ colors: { surface: colors.surface } }}
        />
        <Card.Content>
          {/* Audio Player Section */}
          {playerState.isLoadingAudio ? (
            <View style={styles.playerContainer}>
              <ActivityIndicator size="large" color="#03A9F4" />
              <Text style={styles.statusText} theme={{ colors: { text: isDarkMode ? "#BBBBBB" : "#757575" } }}>音声ファイルを読み込み中...</Text>
            </View>
          ) : playerState.audioError ? (
             <View style={styles.playerContainer}>
                <Text style={styles.errorText}>{playerState.audioError}</Text>
                {/* Optional: Add retry button for audio load */}
             </View>
          ) : (
            <View style={styles.playerContainer}>
               <Slider
                 style={styles.slider}
                 minimumValue={0}
                 maximumValue={playerState.duration > 0 ? playerState.duration : 1} // Prevent NaN/0 max value
                 value={playerState.position}
                 onSlidingComplete={handleSlidingComplete}
                 minimumTrackTintColor="#000000"
                 maximumTrackTintColor="#BDBDBD"
                 thumbTintColor="#000000"
                 disabled={!playerState.playbackStatus?.isLoaded || playerState.duration <= 0} // Disable if not loaded or no duration
               />
               <View style={styles.timeContainer}>
                 <Text style={styles.timeText} theme={{ colors: { text: isDarkMode ? "#BBBBBB" : "#757575" } }}>{formatDuration(playerState.position)}</Text>
                 <Text style={styles.timeText} theme={{ colors: { text: isDarkMode ? "#BBBBBB" : "#757575" } }}>{formatDuration(playerState.duration)}</Text>
               </View>
              <View style={styles.controlsContainer}>
                <IconButton
                  icon="rewind-10"
                  size={30}
                  iconColor="#000000"
                  onPress={seekBackward}
                  disabled={!playerState.playbackStatus?.isLoaded}
                />
                <IconButton
                  icon={playerState.isPlaying ? "pause" : "play"}
                  size={40}
                  iconColor="#000000"
                  onPress={togglePlayback}
                  disabled={!playerState.playbackStatus?.isLoaded}
                />
                <IconButton
                  icon="fast-forward-10"
                  size={30}
                  iconColor="#000000"
                  onPress={seekForward}
                  disabled={!playerState.playbackStatus?.isLoaded}
                />
              </View>
            </View>
          )}
          
          <Divider style={styles.divider} />

          {/* Summary Section */}
          {recording.summary ? (
            <View>
              <Text style={styles.sectionTitle} theme={{ colors: { text: isDarkMode ? "#FFFFFF" : "#000000" } }}>概要</Text>
              <Text style={styles.summaryText} theme={{ colors: { text: isDarkMode ? "#DDDDDD" : "#424242" } }}>{recording.summary}</Text>
              <Divider style={styles.divider} />
            </View>
          ) : (
             <Text style={styles.statusText} theme={{ colors: { text: isDarkMode ? "#BBBBBB" : "#757575" } }}>概要は利用できません。</Text>
          )}

          {/* Transcript Section (Optional) */}
          {/* Consider adding transcript if available */}
          
        </Card.Content>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 10,
  },
  playerContainer: {
    alignItems: "center",
    paddingVertical: 15,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
   slider: {
    width: '90%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: -10, // Adjust as needed
  },
   timeText: {
    fontSize: 12,
    color: '#757575',
  },
  divider: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    color: "#757575",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    color: "#B00020",
  },
});
