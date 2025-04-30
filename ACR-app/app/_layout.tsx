// app/_layout.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <Stack>
        {/* アプリケーションの他のスクリーン設定 */}
        <Stack.Screen name="index" options={{ title: '録音一覧' }} />
        {/* 詳細画面のルートを追加 */}
        <Stack.Screen name="recording/[id]" options={{ title: '録音詳細' }} />
        {/* 不要なコメントアウトを削除 */}
        {/* <Stack.Screen name="auth/login" options={{ title: 'Login' }} /> */}
        {/* <Stack.Screen name="features/recordings/[id]" options={{ title: 'Recording Detail' }} /> */}
        {/* <Stack.Screen name="features/auth/signup" options={{ title: 'Sign Up' }} /> */}
        {/* <Stack.Screen name="features/auth/login" options={{ title: 'Login' }} */}

      </Stack>
    </QueryClientProvider>
  );
}