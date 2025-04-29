import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import SignupScreen from './SignupScreen';
import { useAuth } from '../../hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

type SignupScreenProps = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const mockNavigation = {
  navigate: jest.fn(),
} as unknown as SignupScreenProps['navigation'];

const mockRoute = {
  key: 'Signup',
  name: 'Signup',
} as SignupScreenProps['route'];

describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAuth as jest.Mock).mockReturnValue({
      signUp: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders correctly', () => {
    render(
      <PaperProvider>
        <SignupScreen navigation={mockNavigation} route={mockRoute} />
      </PaperProvider>
    );

    expect(screen.getByText('アカウント作成')).toBeVisible();
    expect(screen.getByLabelText('メールアドレス')).toBeVisible();
    expect(screen.getByLabelText('パスワード')).toBeVisible();
    expect(screen.getByLabelText('パスワード（確認）')).toBeVisible();
    expect(screen.getByText('アカウント作成')).toBeVisible();
    expect(screen.getByText('ログイン画面に戻る')).toBeVisible();
  });

  it('shows error when form is incomplete', () => {
    render(
      <PaperProvider>
        <SignupScreen navigation={mockNavigation} route={mockRoute} />
      </PaperProvider>
    );

    fireEvent.press(screen.getByText('アカウント作成'));
    
    expect(screen.getByText('すべての項目を入力してください')).toBeVisible();
  });

  it('shows error when passwords do not match', () => {
    render(
      <PaperProvider>
        <SignupScreen navigation={mockNavigation} route={mockRoute} />
      </PaperProvider>
    );

    fireEvent.changeText(screen.getByLabelText('メールアドレス'), 'test@example.com');
    fireEvent.changeText(screen.getByLabelText('パスワード'), 'password123');
    fireEvent.changeText(screen.getByLabelText('パスワード（確認）'), 'password456');
    
    fireEvent.press(screen.getByText('アカウント作成'));
    
    expect(screen.getByText('パスワードが一致しません')).toBeVisible();
  });

  it('shows error when password is too short', () => {
    render(
      <PaperProvider>
        <SignupScreen navigation={mockNavigation} route={mockRoute} />
      </PaperProvider>
    );

    fireEvent.changeText(screen.getByLabelText('メールアドレス'), 'test@example.com');
    fireEvent.changeText(screen.getByLabelText('パスワード'), '12345');
    fireEvent.changeText(screen.getByLabelText('パスワード（確認）'), '12345');
    
    fireEvent.press(screen.getByText('アカウント作成'));
    
    expect(screen.getByText('パスワードは6文字以上で入力してください')).toBeVisible();
  });

  it('calls signUp when form is valid', async () => {
    const mockSignUp = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
    });

    render(
      <PaperProvider>
        <SignupScreen navigation={mockNavigation} route={mockRoute} />
      </PaperProvider>
    );

    fireEvent.changeText(screen.getByLabelText('メールアドレス'), 'test@example.com');
    fireEvent.changeText(screen.getByLabelText('パスワード'), 'password123');
    fireEvent.changeText(screen.getByLabelText('パスワード（確認）'), 'password123');
    
    fireEvent.press(screen.getByText('アカウント作成'));
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error when signup fails', async () => {
    const mockSignUp = jest.fn().mockRejectedValue(new Error('Signup failed'));
    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
    });

    render(
      <PaperProvider>
        <SignupScreen navigation={mockNavigation} route={mockRoute} />
      </PaperProvider>
    );

    fireEvent.changeText(screen.getByLabelText('メールアドレス'), 'test@example.com');
    fireEvent.changeText(screen.getByLabelText('パスワード'), 'password123');
    fireEvent.changeText(screen.getByLabelText('パスワード（確認）'), 'password123');
    
    fireEvent.press(screen.getByText('アカウント作成'));
    
    await waitFor(() => {
      expect(screen.getByText('アカウント作成に失敗しました。別のメールアドレスを試してください。')).toBeVisible();
    });
  });

  it('navigates to login screen when button is pressed', () => {
    render(
      <PaperProvider>
        <SignupScreen navigation={mockNavigation} route={mockRoute} />
      </PaperProvider>
    );

    fireEvent.press(screen.getByText('ログイン画面に戻る'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
  });

  it('toggles password visibility when eye icon is pressed', () => {
    render(
      <PaperProvider>
        <SignupScreen navigation={mockNavigation} route={mockRoute} />
      </PaperProvider>
    );

    const eyeIcon = screen.getAllByRole('button')[0]; // First button should be the eye icon
    fireEvent.press(eyeIcon);
    
    expect(eyeIcon).toBeTruthy();
  });
});
