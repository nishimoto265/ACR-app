"use client"

import { useState } from "react"
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from "react-native"
import { Button, TextInput, Text, HelperText } from "react-native-paper"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { AuthStackParamList } from "../../navigation/AuthNavigator"
import { useAuth } from "../../hooks/useAuth"

type Props = NativeStackScreenProps<AuthStackParamList, "Login">

export default function LoginScreen({ navigation }: Props) {
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
    } catch (err) {
      setError("匿名ログインに失敗しました。")
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
          <Text style={styles.title}>通話録音ビューア</Text>

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
            testID="email-input"
          />

          <TextInput
            label="パスワード"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={styles.input}
            disabled={isLoading}
            testID="password-input"
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye" : "eye-off"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />

          <Button mode="contained" onPress={handleLogin} loading={isLoading} disabled={isLoading} style={styles.button}>
            ログイン
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate("Signup")}
            disabled={isLoading}
            style={styles.button}
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
