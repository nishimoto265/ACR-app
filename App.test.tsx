import React from 'react';
import { render } from '@testing-library/react-native';
import App from './App';

// Mock RecoilRoot
jest.mock('recoil', () => ({
  RecoilRoot: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-query
jest.mock('react-query', () => ({
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const MockSafeArea = jest.requireActual('react-native-safe-area-context');
  return {
    ...MockSafeArea,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const MockPaper = jest.requireActual('react-native-paper');
  return {
    ...MockPaper,
    PaperProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

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

describe('<App />', () => {
  jest.setTimeout(15000);

  it('renders the mock RootNavigator within App', async () => {
    // Render App and wait for the mock navigator
    const { findByTestId } = render(<App />);
    const mockNavigator = await findByTestId('mock-root-navigator');
    expect(mockNavigator).toBeTruthy();
  });
});
