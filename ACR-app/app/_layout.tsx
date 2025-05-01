// app/_layout.tsx
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import LoadingScreen from '../components/LoadingScreen';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

// Create a client
const queryClient = new QueryClient();

// Define custom theme (Black and White base)
const theme = {
  ...MD3LightTheme, // Start with the default light theme
  colors: {
    ...MD3LightTheme.colors, // Inherit default colors
    primary: '#000000',       // Black for primary elements (buttons, active states)
    accent: '#424242',         // Dark Gray for accents (could adjust) - Note: 'accent' is deprecated, use secondary or tertiary
    secondary: '#757575',      // Medium Gray for secondary elements
    background: '#FFFFFF',     // White background
    surface: '#FFFFFF',        // White surfaces (Cards, etc.)
    onSurface: '#000000',      // Black text/icons on surfaces
    text: '#000000',           // Default text color black
    placeholder: '#BDBDBD',    // Light Gray for placeholders
    disabled: '#E0E0E0',       // Lighter Gray for disabled states
    // Adjust elevation colors if needed for subtle depth on white background
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF', // Usually surface color
      level2: '#F5F5F5', // Slightly off-white
      level3: '#EEEEEE',
      level4: '#E0E0E0',
      level5: '#BDBDBD',
    },
  },
};

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
    // Wrap everything with PaperProvider and provide the theme
    <PaperProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </QueryClientProvider>
    </PaperProvider>
  );
}