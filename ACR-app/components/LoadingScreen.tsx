import { View, StyleSheet } from "react-native"
import { ActivityIndicator, Text, useTheme } from "react-native-paper"

type Props = {
  message?: string
}

export default function LoadingScreen({ message = "ロード中..." }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color="#03A9F4" />
      <Text style={styles.text} theme={{ colors: { text: theme.dark ? "#FFFFFF" : "#000000" } }}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
})
