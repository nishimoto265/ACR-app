import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import LoginScreen from './LoginScreen';
import { RecoilRoot } from 'recoil';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

// Mocks for useAuth
const mockSignIn = jest.fn();
const mockSignInAnonymously = jest.fn();
const mockSignUpWithEmail = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInAnonymously: mockSignInAnonymously,
    signUpWithEmail: mockSignUpWithEmail,
    error: null,
    loading: false,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

const MockNavigator = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
MockNavigator.displayName = 'MockNavigator';

type MockLoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const mockNavigation = {
  navigate: jest.fn(),
} as unknown as MockLoginScreenProps['navigation'];

const mockRoute = {
  key: 'LoginScreenKey',
  name: 'Login',
  params: {},
} as MockLoginScreenProps['route'];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot>
    <PaperProvider>
      {children}
    </PaperProvider>
  </RecoilRoot>
);
TestWrapper.displayName = 'TestWrapper';

describe('LoginScreen', () => {
  jest.useFakeTimers();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('renders correctly', async () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    expect(await screen.findByTestId('email-input')).toBeVisible();
    expect(await screen.findByTestId('password-input')).toBeVisible();
    expect(await screen.findByText('ログイン')).toBeVisible();
    expect(await screen.findByText('アカウント作成')).toBeVisible();
    expect(await screen.findByText('匿名でログイン')).toBeVisible();
  });

  it('handles email/password input', async () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    const emailInput = await screen.findByTestId('email-input');
    const passwordInput = await screen.findByTestId('password-input');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('calls signIn on Login button press', async () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    const emailInput = await screen.findByTestId('email-input');
    const passwordInput = await screen.findByTestId('password-input');
    const loginButton = await screen.findByText('ログイン');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('calls signInAnonymously on Anonymous Login button press', async () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    const anonymousButton = await screen.findByText('匿名でログイン');
    fireEvent.press(anonymousButton);

    await waitFor(() => {
      expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
    });
  });

  it('navigates to Signup screen on Account Creation button press', async () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    const signUpButton = await screen.findByText('アカウント作成');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
    });
  });
});
