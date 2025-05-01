// app/_layout.tsx
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../hooks/useAuth'; 
import { Slot, useRouter, useSegments, Stack } from 'expo-router'; 
import LoadingScreen from '../components/LoadingScreen'; 

// Create a client
const queryClient = new QueryClient();

// Component to handle navigation logic based on auth state
function InitialLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; 

    const inAuthGroup = segments[0] === '(auth)'; 

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login'); 
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/home'); 
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Wrap the Slot with a Stack navigator
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Slot renders the active child route based on the URL */}
      <Slot />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
}