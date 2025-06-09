import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Or your preferred icon library

export default function TabLayout() {
  return (
    <>
      {/* Define the stack screen for recording details globally within this layout */}
      {/* <Stack.Screen name="recording/[id]" options={{ headerShown: true, title: "録音詳細" }} />  <- Removed incorrect definition */}

      <Tabs
        screenOptions={{
          headerShown: true, // Show headers for tab screens
          // 明示的に色を設定
          tabBarActiveTintColor: '#03A9F4', // 水色に変更
          tabBarInactiveTintColor: '#757575',
        }}>
        <Tabs.Screen
          name="home" // This corresponds to app/(tabs)/home.tsx
          options={{
            title: 'ホーム',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings" // This corresponds to app/(tabs)/settings.tsx
          options={{
            title: '設定',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recording/[id]" // This corresponds to app/(tabs)/recording/[id].tsx
          options={{
            title: '録音詳細', // Or a more appropriate title
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="mic-outline" size={size} color={color} /> // Example: mic icon
            ),
            href: null, // Hide this tab from the tab bar
          }}
        />
        {/* Add other tabs here if needed */}
      </Tabs>
    </>
  );
}
