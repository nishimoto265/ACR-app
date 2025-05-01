import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    // Configure the Stack navigator for the auth screens
    <Stack screenOptions={{ headerShown: false }}>
      {/* Define screens within the auth group */}
      {/* These names correspond to files like app/(auth)/login.tsx */}
      <Stack.Screen name="login" />  
      <Stack.Screen name="signup" /> 
      {/* Add other auth-related screens here if needed */}
    </Stack>
  );
}
