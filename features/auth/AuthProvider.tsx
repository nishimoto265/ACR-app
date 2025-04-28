"use client"

import { createContext, useEffect, useState, type ReactNode } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInAnonymously as firebaseSignInAnonymously,
} from "firebase/auth"
import { auth } from "../../services/firebase"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInAnonymously: () => Promise<void>
  error: string | null
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInAnonymously: async () => {},
  error: null,
})

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setError("ログインに失敗しました。メールアドレスとパスワードを確認してください。")
      console.error("ログインエラー:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    setError(null)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      setError("アカウント作成に失敗しました。別のメールアドレスを試してください。")
      console.error("アカウント作成エラー:", error)
      throw error
    }
  }

  const signOut = async () => {
    setError(null)
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      setError("ログアウトに失敗しました。")
      console.error("ログアウトエラー:", error)
      throw error
    }
  }

  const signInAnonymously = async () => {
    setError(null)
    try {
      await firebaseSignInAnonymously(auth)
    } catch (error) {
      setError("匿名ログインに失敗しました。")
      console.error("匿名ログインエラー:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInAnonymously,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
