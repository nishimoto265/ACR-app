"use client"

import { useState, useCallback } from "react"
import { View, FlatList, StyleSheet, RefreshControl } from "react-native"
import { Searchbar, Card, Text, ActivityIndicator, Divider } from "react-native-paper"
import { useRouter } from 'expo-router';
// Corrected import paths
import { useRecordings, useSearchRecordings } from "../../hooks/useRecordings"
import type { Recording } from "../../services/recordings"
import { formatDate } from "../../utils/dateFormatter"

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // useRecordings hook provides data, loading states, and refetch function
  const { data: recordings, isLoading, isError, refetch, isRefetching } = useRecordings()

  // useSearchRecordings hook provides search results based on query
  const { data: searchResults, isLoading: isSearchLoading } = useSearchRecordings(searchQuery, 20)

  // Updates search query and state
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(query.length > 0)
  }

  // Refetches recording data on pull-to-refresh
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

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
    <Card style={styles.card} onPress={() => handleRecordingPress(item.id)}>
      <Card.Content>
        <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt.toDate())}</Text>
        {item.summary && (
          <>
            <Divider style={styles.divider} />
            <Text numberOfLines={2} style={styles.summary}>
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
    <View style={styles.container}>
      <Searchbar
        placeholder="電話番号で検索"
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      {isLoadingData ? (
        // Loading indicator
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      ) : isError ? (
        // Error message
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} colors={["#2196F3"]} />}
        />
      ) : (
        // Empty state message
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
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
    backgroundColor: "#F5F5F5",
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
})
