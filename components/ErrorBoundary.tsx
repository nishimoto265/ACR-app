import { Component, type ErrorInfo, type ReactNode } from "react"
import { View, StyleSheet } from "react-native"
import { Button, Text } from "react-native-paper"
import * as Sentry from "@sentry/react-native"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("エラーが発生しました:", error, errorInfo)
    Sentry.captureException(error)
  }

  handleRestart = () => {
    console.log('Restart button clicked, resetting state...')
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>エラーが発生しました</Text>
          <Text style={styles.message}>{this.state.error?.message || "アプリケーションで問題が発生しました。"}</Text>
          <Button 
            mode="contained" 
            onPress={this.handleRestart} 
            style={styles.button}>
            アプリを再起動
          </Button>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    marginTop: 16,
  },
})
