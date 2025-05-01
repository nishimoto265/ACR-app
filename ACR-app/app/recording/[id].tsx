import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

export default function RecordingDetailScreen() {
  // Get the recording ID from the route parameters
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      {/* Configure the header dynamically */}
      <Stack.Screen 
        options={{
          headerShown: true,
          title: `録音詳細: ${id}` // Display ID in the title for now
        }}
      />
      <Text style={styles.title}>録音詳細画面</Text>
      <Text style={styles.idText}>録音 ID: {id}</Text>
      {/* TODO: Fetch and display recording details using the 'id' */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  idText: {
    fontSize: 18,
  },
});
