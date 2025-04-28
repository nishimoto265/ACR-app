import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import LoginScreen from './LoginScreen';
import { RecoilRoot } from 'recoil';
import { View } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const mockSignInWithGoogle = jest.fn();
const mockSignInWithEmail = jest.fn();
const mockSignUpWithEmail = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    signInWithEmail: mockSignInWithEmail,
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

type MockLoginScreenProps = StackScreenProps<AuthStackParamList, 'Login'>;

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    expect(screen.getByPlaceholderText('メールアドレス')).toBeVisible();
    expect(screen.getByPlaceholderText('パスワード')).toBeVisible();
    expect(screen.getByText('ログイン')).toBeVisible();
    expect(screen.getByText('または')).toBeVisible();
    expect(screen.getByText('Googleでサインイン')).toBeVisible();
    expect(screen.getByText('アカウントをお持ちでない場合')).toBeVisible();
    expect(screen.getByText('新規登録')).toBeVisible();
  });

  it('handles email/password input', () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(emailInput.props.value).toBe('test@example.com');
    expect(passwordInput.props.value).toBe('password123');
  });

  it('calls signInWithEmail on Login button press', () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード');
    const loginButton = screen.getByText('ログイン');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('calls signInWithGoogle on Google Sign-In button press', () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    const googleButton = screen.getByText('Googleでサインイン');
    fireEvent.press(googleButton);

    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
  });

  it('navigates to SignUp screen on Sign Up button press', () => {
    render(
      <TestWrapper>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>,
    );

    const signUpButton = screen.getByText('新規登録');
    fireEvent.press(signUpButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
  });
});
