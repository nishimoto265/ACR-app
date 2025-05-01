import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Configure the header dynamically */}
      <Stack.Screen
        options={{
          headerShown: true,
          title: `録音詳細: ${id}`,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 10 }}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color="#000000"
              />
            </TouchableOpacity>
          ),
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
