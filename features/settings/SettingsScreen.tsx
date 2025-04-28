"use client"

import { useState } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { List, Divider, Switch, Text } from "react-native-paper"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
import { useAuth } from "../../hooks/useAuth"

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const [isClearing, setIsClearing] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  const appVersion = Constants.expoConfig?.version || "1.0.0"

  const handleClearCache = async () => {
    Alert.alert("キャッシュを削除", "オフラインキャッシュを削除しますか？\nこの操作は元に戻せません。", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            setIsClearing(true)
            // キャッシュのクリア処理
            await AsyncStorage.clear()
            Alert.alert("完了", "キャッシュを削除しました")
          } catch (error) {
            console.error("キャッシュ削除エラー:", error)
            Alert.alert("エラー", "キャッシュの削除に失敗しました")
          } finally {
            setIsClearing(false)
          }
        },
      },
    ])
  }

  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      {
        text: "キャンセル",
        style: "cancel",
      },
      {
        text: "ログアウト",
        onPress: async () => {
          try {
            await signOut()
          } catch (error) {
            console.error("ログアウトエラー:", error)
            Alert.alert("エラー", "ログアウトに失敗しました")
          }
        },
      },
    ])
  }

  const toggleHighContrast = () => {
    setHighContrast(!highContrast)
    // 実際のアプリでは、この設定を保存して適用する処理を追加
  }

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>アプリ設定</List.Subheader>

        <List.Item
          title="ハイコントラストモード"
          description="テキストと背景のコントラストを高くします"
          left={(props) => <List.Icon {...props} icon="contrast" />}
          right={() => <Switch value={highContrast} onValueChange={toggleHighContrast} />}
        />

        <Divider />

        <List.Item
          title="キャッシュを削除"
          description="オフラインキャッシュを削除します"
          left={(props) => <List.Icon {...props} icon="cached" />}
          onPress={handleClearCache}
          disabled={isClearing}
        />

        <Divider />

        <List.Item
          title="ログアウト"
          description="アプリからログアウトします"
          left={(props) => <List.Icon {...props} icon="logout" />}
          onPress={handleLogout}
        />
      </List.Section>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>バージョン: {appVersion}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  versionContainer: {
    padding: 16,
    alignItems: "center",
  },
  versionText: {
    color: "#757575",
  },
})
