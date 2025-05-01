"use client"

import { useState } from "react"
import { View, StyleSheet, Alert } from "react-native"
import { List, Divider, Switch, Text } from "react-native-paper"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
// Corrected import path for useAuth
import { useAuth } from "../../hooks/useAuth" 

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const [isClearing, setIsClearing] = useState(false)
  const [highContrast, setHighContrast] = useState(false)

  // Get app version from Expo constants
  const appVersion = Constants.expoConfig?.version || "1.0.0"

  // Handle clearing AsyncStorage cache
  const handleClearCache = async () => {
    Alert.alert("キャッシュを削除", "オフラインキャッシュを削除しますか？\nこの操作は元に戻せません。", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            setIsClearing(true)
            await AsyncStorage.clear() // Clear all AsyncStorage data
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

  // Handle user logout
  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        onPress: async () => {
          try {
            await signOut() // Call the signOut function from useAuth
            // Redirection is handled by the root layout (_layout.tsx)
          } catch (error) {
            console.error("ログアウトエラー:", error)
            Alert.alert("エラー", "ログアウトに失敗しました")
          }
        },
      },
    ])
  }

  // Toggle high contrast mode (implementation detail omitted)
  const toggleHighContrast = () => {
    setHighContrast(!highContrast)
    // In a real app, save this setting (e.g., in AsyncStorage or user profile)
    // and apply the theme/style changes throughout the app.
  }

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>アプリ設定</List.Subheader>

        {/* High Contrast Toggle */}
        <List.Item
          title="ハイコントラストモード"
          description="テキストと背景のコントラストを高くします"
          left={(props) => <List.Icon {...props} icon="contrast" />}
          right={() => <Switch value={highContrast} onValueChange={toggleHighContrast} />}
        />
        <Divider />

        {/* Clear Cache Button */}
        <List.Item
          title="キャッシュを削除"
          description="オフラインキャッシュを削除します"
          left={(props) => <List.Icon {...props} icon="cached" />}
          onPress={handleClearCache}
          disabled={isClearing} // Disable button while clearing
        />
        <Divider />

        {/* Logout Button */}
        <List.Item
          title="ログアウト"
          description="アプリからログアウトします"
          left={(props) => <List.Icon {...props} icon="logout" />}
          onPress={handleLogout}
        />
      </List.Section>

      {/* App Version Display */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>バージョン: {appVersion}</Text>
      </View>
    </View>
  )
}

// Styles remain the same
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