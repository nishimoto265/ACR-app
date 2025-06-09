// app/_layout.tsx
import React, { useEffect, createContext, useState, useMemo, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import { Slot, useRouter, useSegments, Stack } from 'expo-router';
import LoadingScreen from '../components/LoadingScreen';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { useFonts } from 'expo-font';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient();

// --- Theme Definitions and Context (Moved from ThemeContext.tsx) --- 

// Custom Light Theme
const AppLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#03A9F4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E1F5FE',
    onPrimaryContainer: '#000000',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    onSurface: '#000000',
    secondary: '#000000',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E1F5FE',
    onSecondaryContainer: '#000000',
    tertiary: '#000000',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFFFFF',
    onTertiaryContainer: '#000000',
    error: MD3LightTheme.colors.error,
    onError: MD3LightTheme.colors.onError,
    errorContainer: MD3LightTheme.colors.errorContainer,
    onErrorContainer: MD3LightTheme.colors.onErrorContainer,
    surfaceVariant: '#FFFFFF',
    onSurfaceVariant: '#000000',
    outline: '#000000',
    outlineVariant: '#FFFFFF',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#F5F5F5',
      level4: '#E1F5FE',
      level5: '#B3E5FC',
    },
    surfaceDisabled: '#FFFFFF',
    onSurfaceDisabled: '#000000',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
};

// Custom Dark Theme
const AppDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#03A9F4',
    onPrimary: '#000000',
    primaryContainer: '#0277BD',
    onPrimaryContainer: '#FFFFFF',
    background: '#121212',
    surface: '#1E1E1E',
    onSurface: '#FFFFFF',
    secondary: '#FFFFFF',
    onSecondary: '#000000',
    secondaryContainer: '#0277BD',
    onSecondaryContainer: '#FFFFFF',
    tertiary: '#FFFFFF',
    onTertiary: '#000000',
    tertiaryContainer: '#0277BD',
    onTertiaryContainer: '#FFFFFF',
    error: MD3DarkTheme.colors.error,
    onError: MD3DarkTheme.colors.onError,
    errorContainer: MD3DarkTheme.colors.errorContainer,
    onErrorContainer: MD3DarkTheme.colors.onErrorContainer,
    surfaceVariant: '#121212',
    onSurfaceVariant: '#FFFFFF',
    outline: '#FFFFFF',
    outlineVariant: '#121212',
    elevation: {
      level0: 'transparent',
      level1: '#121212',
      level2: '#1E1E1E',
      level3: '#252525',
      level4: '#0277BD',
      level5: '#01579B',
    },
    surfaceDisabled: '#121212',
    onSurfaceDisabled: '#FFFFFF',
    backdrop: 'rgba(0, 0, 0, 0.8)',
  },
};

type ThemeMode = 'light' | 'dark';

interface ThemeContextProps {
  themeMode: ThemeMode;
  isDarkMode: boolean;
  theme: MD3Theme;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // Load theme from AsyncStorage on app start
  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeModeState(savedTheme);
        }
      } catch (error) {
        console.error('テーマ設定の読み込みエラー:', error);
      } finally {
        setIsThemeLoaded(true);
      }
    }
    loadTheme();
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    if (mode === 'light' || mode === 'dark') {
      setThemeModeState(mode);
      // Save theme selection to AsyncStorage
      AsyncStorage.setItem('themeMode', mode).catch(error => {
        console.error('テーマ設定の保存エラー:', error);
      });
    }
  };

  const isDarkMode = themeMode === 'dark';
  const theme = isDarkMode ? AppDarkTheme : AppLightTheme;

  const contextValue = useMemo(() => ({
    themeMode,
    isDarkMode,
    theme,
    setThemeMode,
  }), [themeMode, isDarkMode, theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// --- Core App Structure Components --- 

function InitialLayout() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  // Theme is now accessed within RootLayoutContent

  const [fontsLoaded, fontError] = useFonts({
    ...MaterialCommunityIcons.font,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (isAuthLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [user, isAuthLoading, segments, router, fontsLoaded, fontError]);

  if (isAuthLoading || !fontsLoaded) {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ 
        headerShown: false, 
    }}>
      <Slot />
    </Stack>
  );
}

// Component wrapping the core providers and initial layout logic
function AppStructure() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// --- Theme Application Component ---

// This component consumes the theme and applies it via PaperProvider
function ThemedApp() {
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme ?? AppLightTheme;

  return (
    <PaperProvider theme={theme}>
      <AppStructure />
    </PaperProvider>
  );
}

// --- Root Layout Export --- 

// Root layout only provides the ThemeProvider
export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}