"use client"

import { useState } from "react"
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { Button, TextInput, Text, HelperText } from "react-native-paper"
// Remove navigation types
// import type { NativeStackScreenProps } from "@react-navigation/native-stack"
// import type { AuthStackParamList } from "../../navigation/AuthNavigator"
import { useRouter } from 'expo-router'; // Import useRouter
import { useAuth } from "../../hooks/useAuth" // Corrected import path

// Remove Props type and navigation prop
export default function SignupScreen() { 
  const router = useRouter(); // Initialize router
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [secureTextEntry, setSecureTextEntry] = useState(true)

  const { signUp } = useAuth()

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError("すべての項目を入力してください")
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      return
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await signUp(email, password)
      // No explicit navigation needed, _layout.tsx handles redirection after signup
    } catch (err) {
      setError("アカウント作成に失敗しました。別のメールアドレスを試してください。")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>アカウント作成</Text>

          {error && (
            <HelperText type="error" visible={!!error}>
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
          />

          <TextInput
            label="パスワード"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            disabled={isLoading}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />

          <TextInput
            label="パスワード（確認）"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            disabled={isLoading}
          />

          <Button
            mode="contained"
            onPress={handleSignup}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            アカウント作成
          </Button>

          <Button 
            mode="text" 
            // Use router.back() to go back to the previous screen (likely Login)
            onPress={() => router.back()} 
            disabled={isLoading} 
            style={styles.button}
          >
            ログイン画面に戻る
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
