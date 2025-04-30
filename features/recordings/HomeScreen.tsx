"use client"

import { useState, useCallback } from "react"
import { View, FlatList, StyleSheet, RefreshControl } from "react-native"
import { Searchbar, Card, Text, ActivityIndicator, Divider } from "react-native-paper"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RecordingsStackParamList } from "../../navigation/MainNavigator"
import { useRecordings, useSearchRecordings } from "../../hooks/useRecordings"
import type { Recording } from "../../services/recordings"
import { formatDate } from "../../utils/dateFormatter"

type Props = NativeStackScreenProps<RecordingsStackParamList, "Home">

export default function HomeScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const { data: recordings, isLoading, isError, refetch, isRefetching } = useRecordings()

  const { data: searchResults, isLoading: isSearchLoading } = useSearchRecordings(searchQuery, 20)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setIsSearching(query.length > 0)
  }

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleRecordingPress = (recordingId: string) => {
    navigation.navigate("RecordingDetail", { recordingId })
  }

  const renderRecordingItem = ({ item }: { item: Recording }) => (
    <Card style={styles.card} onPress={() => handleRecordingPress(item.id)}>
      <Card.Content>
        <Text style={styles.phoneNumber}>{item.phoneNumber}</Text>
        <Text style={styles.date}>{formatDate(item.recordedAt)}</Text>
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            データの読み込みに失敗しました。 下にスワイプして再読み込みしてください。
          </Text>
        </View>
      ) : displayData && displayData.length > 0 ? (
        <FlatList
          data={displayData}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} colors={["#2196F3"]} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isSearching ? "検索結果が見つかりませんでした" : "録音データがありません"}
          </Text>
        </View>
      )}
    </View>
  )
}

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
