import { View, StyleSheet } from "react-native"
import { ActivityIndicator, Text } from "react-native-paper"

type Props = {
  message?: string
}

export default function LoadingScreen({ message = "ロード中..." }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
})
