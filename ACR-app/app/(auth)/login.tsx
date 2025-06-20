"use client"

import { useState, useContext } from "react"
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { Button, TextInput, Text, HelperText } from "react-native-paper"
// Remove navigation types
// import type { NativeStackScreenProps } from "@react-navigation/native-stack"
// import type { AuthStackParamList } from "../../navigation/AuthNavigator"
import { useRouter } from 'expo-router'; // Import useRouter
import { useAuth } from "../../hooks/useAuth" // Corrected import path for useAuth
import { ThemeContext } from "../_layout" // テーマコンテキストをインポート

// Remove Props type and navigation prop
export default function LoginScreen() { 
  const router = useRouter(); // Initialize router
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const isDarkMode = themeContext?.isDarkMode || false;
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secureTextEntry, setSecureTextEntry] = useState(true)

  const { signIn, signInAnonymously } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await signIn(email, password)
      // No explicit navigation needed here, _layout.tsx handles redirection
    } catch (err) {
      setError("ログインに失敗しました。認証情報を確認してください。")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnonymousLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      await signInAnonymously()
      // No explicit navigation needed here, _layout.tsx handles redirection
    } catch (err) {
      setError("匿名ログインに失敗しました。")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme?.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: isDarkMode ? "#FFFFFF" : "#000000" }]}>通話録音ビューア</Text>

          {error && (
            <HelperText type="error" visible={!!error} theme={{ colors: { error: "#B00020" } }}>
              {error}
            </HelperText>
          )}

          <TextInput
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            disabled={isLoading}
            testID="email-input"
            theme={{ 
              colors: { 
                primary: "#03A9F4", 
                background: isDarkMode ? "#333333" : "#FFFFFF",
                text: isDarkMode ? "#FFFFFF" : "#000000",
                placeholder: isDarkMode ? "#BBBBBB" : "#757575",
                onSurfaceVariant: isDarkMode ? "#BBBBBB" : "#757575"
              } 
            }}
          />

          <TextInput
            label="パスワード"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            disabled={isLoading}
            testID="password-input"
            theme={{ 
              colors: { 
                primary: "#03A9F4", 
                background: isDarkMode ? "#333333" : "#FFFFFF",
                text: isDarkMode ? "#FFFFFF" : "#000000",
                placeholder: isDarkMode ? "#BBBBBB" : "#757575",
                onSurfaceVariant: isDarkMode ? "#BBBBBB" : "#757575"
              } 
            }}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                color={isDarkMode ? "#FFFFFF" : "#000000"}
              />
            }
          />

          <Button mode="contained" onPress={handleLogin} loading={isLoading} disabled={isLoading} style={styles.button}>
            ログイン
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/(auth)/signup')} // Use router.push
            disabled={isLoading}
            style={styles.button}
            theme={{ 
              colors: { 
                primary: "#03A9F4",
                outline: isDarkMode ? "#FFFFFF" : "#03A9F4"
              } 
            }}
          >
            アカウント作成
          </Button>

          <Button mode="text" onPress={handleAnonymousLogin} disabled={isLoading} style={styles.button}>
            匿名でログイン
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
})
