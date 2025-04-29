import React from 'react';
import { render } from '@testing-library/react-native';
import App from './App';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { RecoilRoot } from 'recoil';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';

// Mock RecoilRoot
jest.mock('recoil', () => ({
  RecoilRoot: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-query
jest.mock('react-query', () => ({
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock services/firebase
jest.mock('./services/firebase', () => ({
  auth: { /* Provide mock auth object if needed */ },
  firestore: { /* Provide mock firestore object if needed */ },
  storage: { /* Provide mock storage object if needed */ },
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  manifest: {
    extra: {},
  },
}));

// Mock ErrorBoundary to simply render children
jest.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// RootNavigatorをモック化 (Simple functional component mock)
jest.mock('./navigation/RootNavigator', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const MockRootNavigator = () => <View testID="mock-root-navigator" />;
  MockRootNavigator.displayName = 'MockRootNavigator';
  return MockRootNavigator;
});

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    // Mock NavigationContainer to simply render its children
    NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    // Mock useNavigationContainerRef to return a dummy ref object or undefined
    useNavigationContainerRef: jest.fn(),
  };
});

// AuthProvider コンポーネント自体をモック化
jest.mock('./features/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Helper function to render with all necessary providers from App.tsx
const renderWithAllProviders = (ui: React.ReactElement, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        gcTime: Infinity, // Prevent garbage collection during tests
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <PaperProvider>
        <RecoilRoot>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <AuthProvider>
                {children}
              </AuthProvider>
            </ErrorBoundary>
          </QueryClientProvider>
        </RecoilRoot>
      </PaperProvider>
    </SafeAreaProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

describe('<App />', () => {
  jest.setTimeout(15000);

  it('renders the mock RootNavigator within App', async () => {
    // Render App and wait for the mock navigator
    const { findByTestId } = renderWithAllProviders(<App />);
    // Increase timeout to allow for async loading (e.g., useCachedResources)
    const mockNavigator = await findByTestId('mock-root-navigator', {}, { timeout: 5000 });
    expect(mockNavigator).toBeTruthy();
  });
});
