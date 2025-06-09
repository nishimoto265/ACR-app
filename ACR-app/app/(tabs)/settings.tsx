"use client"

import { useState, useEffect, useContext } from "react"
import { View, StyleSheet, Alert, ToastAndroid, Platform } from "react-native"
import { List, Divider, Text, SegmentedButtons } from "react-native-paper"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"
// Corrected import path for useAuth
import { useAuth } from "../../hooks/useAuth" 
import { ThemeContext } from "../_layout" // リアルタイムテーマ更新のためにThemeContextをインポート

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const [isClearing, setIsClearing] = useState(false)
  // ThemeContextからテーマ情報を取得
  const themeContext = useContext(ThemeContext);
  const themeMode = themeContext?.themeMode || 'light';
  const theme = themeContext?.theme;
  const contextSetThemeMode = themeContext?.setThemeMode || (() => {});
  
  // テーマ変更時に通知を表示する関数
  const setThemeMode = (mode: 'light' | 'dark') => {
    contextSetThemeMode(mode);
    
    // テーマが変更されたことをユーザーに通知
    if (Platform.OS === 'android') {
      ToastAndroid.show(
        `${mode === 'light' ? 'ライト' : 'ダーク'}モードに変更しました`, 
        ToastAndroid.SHORT
      );
    } else {
      // iOSの場合はAlertを使用（実際のアプリではもっと洗練された通知方法を使用することをお勧めします）
      Alert.alert('テーマを変更しました', `${mode === 'light' ? 'ライト' : 'ダーク'}モードに変更しました`);
    }
  };

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

  return (
    <View style={[styles.container, { backgroundColor: theme?.colors.background }]}>
      <List.Section>
        <List.Subheader>アプリ設定</List.Subheader>

        {/* Theme Selection */}
        <List.Item
          title="表示テーマ"
          description="アプリの表示モードを選択します"
          left={(props) => <List.Icon {...props} icon="brightness-6" color="#03A9F4" />}
        />
        <SegmentedButtons
          style={styles.segmentedButton}
          value={themeMode}
          onValueChange={(value) => setThemeMode(value as 'light' | 'dark')}
          theme={{ colors: { primary: "#03A9F4", outline: "#03A9F4" } }}
          buttons={[
            { value: 'light', label: 'ライト', icon: 'white-balance-sunny' },
            { value: 'dark', label: 'ダーク', icon: 'weather-night' },
          ]}
        />
        <Divider />

        {/* Clear Cache Button */}
        <List.Item
          title="キャッシュを削除"
          description="オフラインキャッシュを削除します"
          left={(props) => <List.Icon {...props} icon="cached" color="#03A9F4" />}
          onPress={handleClearCache}
          disabled={isClearing} // Disable button while clearing
        />
        <Divider />

        {/* Logout Button (moved here for structure) */}
        <List.Item
          title="ログアウト"
          description="アプリからログアウトします"
          left={(props) => <List.Icon {...props} icon="logout" color="#03A9F4" />}
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
    // backgroundColor is now handled by PaperProvider theme
  },
  segmentedButton: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  versionContainer: {
    padding: 16,
    alignItems: "center",
  },
  versionText: {
    color: "#757575",
  },
})