import { SafeAreaProvider } from "react-native-safe-area-context"
import { Provider as PaperProvider } from "react-native-paper"
import { NavigationContainer } from "@react-navigation/native"
import { RecoilRoot } from "recoil"
import { QueryClient, QueryClientProvider } from "react-query"

import { theme } from "./theme"
import { AuthProvider } from "./features/auth/AuthProvider"
import RootNavigator from "./navigation/RootNavigator"
import { ErrorBoundary } from "./components/ErrorBoundary"

// React Query クライアントの初期化
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 30 * 60 * 1000, // 30分
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <RecoilRoot>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <NavigationContainer>
                  <RootNavigator />
                </NavigationContainer>
              </AuthProvider>
            </QueryClientProvider>
          </RecoilRoot>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
