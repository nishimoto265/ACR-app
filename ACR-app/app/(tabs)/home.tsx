"use client"

import React from 'react';
import { useState, useCallback, useContext } from "react"
import { View, FlatList, StyleSheet, RefreshControl } from "react-native"
import { Searchbar, Card, Text, ActivityIndicator, Divider, Button } from "react-native-paper"
import { useRouter } from 'expo-router';
// Corrected import paths
import { useRecordings, useSearchRecordings } from "../../hooks/useRecordings"
import { useAcr } from "../../hooks/useAcr" // ACR APIフックをインポート
import type { Recording } from "../../services/recordings"
import { formatDate } from "../../utils/dateFormatter"
import { ThemeContext } from "../_layout" // テーマのインポート
import ProcessingProgress from "../../components/ProcessingProgress" // 進捗表示コンポーネントをインポート

// ステータスに基づいて表示テキストを取得
const getStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '処理待ち';
    case 'processing':
      return '処理中';
    case 'completed':
      return '完了';
    case 'failed':
      return 'エラー';
    default:
      return status || '不明';
  }
};

// ステータスに基づいて表示色を取得
const getStatusColor = (status: string, isDarkMode: boolean): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return isDarkMode ? '#FFC107' : '#FF9800'; // オレンジ
    case 'processing':
      return isDarkMode ? '#2196F3' : '#1976D2'; // 青
    case 'completed':
      return isDarkMode ? '#4CAF50' : '#388E3C'; // 緑
    case 'failed':
      return isDarkMode ? '#F44336' : '#D32F2F'; // 赤
    default:
      return isDarkMode ? '#BBBBBB' : '#757575'; // グレー
  }
};

export default function HomeScreen() {
  const router = useRouter();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const isDarkMode = themeContext?.isDarkMode || false;
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // useRecordings hook provides data, loading states, and refetch function
  const { data: recordings, isLoading, isError, refetch, isRefetching } = useRecordings()

  // useSearchRecordings hook provides search results based on query
  const { data: searchResults, isLoading: isSearchLoading } = useSearchRecordings(searchQuery, 20)

  // useAcr hook to interact with the ACR processing service
  const { processAll, isProcessing, progress } = useAcr()

  // Updates search query and state
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(query.length > 0)
  }

  // Refetches recording data on pull-to-refresh
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Call the ACR processing service
  const handleProcessAll = useCallback(() => {
    processAll()
  }, [processAll])

  // Navigates to the recording detail screen
  const handleRecordingPress = (recordingId: string) => {
    router.push({
      // Path relative to the current layout group (tabs)
      pathname: "/recording/[id]", 
      params: { id: recordingId },
    });
  }

  // Renders individual recording item in the list
  const renderRecordingItem = ({ item }: { item: Recording }) => (
    <Card 
      style={styles.card} 
      onPress={() => handleRecordingPress(item.id)}
      theme={{ 
        colors: { 
          primary: "#03A9F4",
          background: theme?.colors.surface || "#FFFFFF",
          outline: isDarkMode ? "#FFFFFF" : "#000000" 
        } 
      }}
    >
      <Card.Content>
        <Text style={styles.phoneNumber} theme={{ colors: { text: isDarkMode ? "#FFFFFF" : "#000000" } }}>{item.phoneNumber}</Text>
        <Text style={styles.date} theme={{ colors: { text: isDarkMode ? "#BBBBBB" : "#757575" } }}>{formatDate(item.createdAt.toDate())}</Text>
        
        {/* ステータス表示 */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel} theme={{ colors: { text: isDarkMode ? "#BBBBBB" : "#757575" } }}>ステータス: </Text>
          <Text 
            style={[
              styles.statusValue, 
              { 
                color: getStatusColor(item.status, isDarkMode),
              }
            ]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
        
        {item.summary && (
          <>
            <Divider style={styles.divider} />
            <Text numberOfLines={2} style={styles.summary} theme={{ colors: { text: isDarkMode ? "#DDDDDD" : "#424242" } }}>
              {item.summary}
            </Text>
          </>
        )}
      </Card.Content>
    </Card>
  )

  // Determine which data and loading state to use based on search status
  const displayData = isSearching ? searchResults : recordings
  const isLoadingData = isLoading || (isSearching && isSearchLoading)

  return (
    <View style={[styles.container, { backgroundColor: theme?.colors.background }]}>
      <Searchbar
        placeholder="電話番号で検索"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#03A9F4"
        inputStyle={{ color: isDarkMode ? "#FFFFFF" : "#000000" }}
        theme={{ 
          colors: { 
            primary: "#03A9F4",
            background: theme?.colors.background || "#FFFFFF",
            onSurface: isDarkMode ? "#FFFFFF" : "#000000",
            secondary: "#03A9F4",
            placeholder: "#757575"
          } 
        }}
        placeholderTextColor="#757575"
      />

      {/* 録音データ取り込みボタン */}
      <View style={styles.actionContainer}>
        <Button 
          mode="contained" 
          onPress={handleProcessAll}
          loading={isProcessing}
          disabled={isProcessing}
          style={styles.processButton}
          icon="refresh"
        >
          録音データ取り込み
        </Button>
      </View>
      
      {/* 処理進捗表示 */}
      {isProcessing && progress && (
        <ProcessingProgress 
          toProcess={progress.toProcess} 
          processed={progress.processed}
          isDarkMode={isDarkMode}
        />
      )}

      {isLoadingData ? (
        // Loading indicator
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#03A9F4" />
          <Text style={styles.loadingText} theme={{ colors: { text: isDarkMode ? "#FFFFFF" : "#000000" } }}>データを読み込み中...</Text>
        </View>
      ) : isError ? (
        // Error message
        <View style={styles.errorContainer}>
          <Text style={styles.errorText} theme={{ colors: { text: "#B00020" } }}>
            データの読み込みに失敗しました。 下にスワイプして再読み込みしてください。
          </Text>
        </View>
      ) : displayData && displayData.length > 0 ? (
        // Recordings list
        <FlatList
          data={displayData}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} colors={["#03A9F4"]} />}
        />
      ) : (
        // Empty state message
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText} theme={{ colors: { text: isDarkMode ? "#BBBBBB" : "#757575" } }}>
            {isSearching ? "検索結果が見つかりませんでした" : "録音データがありません"}
          </Text>
        </View>
      )}
    </View>
  )
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is now handled by PaperProvider theme
  },
  searchBar: {
    margin: 8,
    elevation: 2,
  },
  listContent: {
    padding: 8,
  },
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  date: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  summary: {
    fontSize: 14,
    color: "#424242",
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#757575",
  },
  actionContainer: {
    margin: 8,
    alignItems: "center",
  },
  processButton: {
    margin: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusValue: {
    fontSize: 14,
  },
})
