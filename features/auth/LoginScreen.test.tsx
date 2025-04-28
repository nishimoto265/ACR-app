// /media/thithilab/ボリューム1/ACR/ACR-app/features/auth/LoginScreen.test.tsx
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper'; // Keep actual Provider/Theme
import LoginScreen from './LoginScreen';
import { useAuth } from '../../hooks/useAuth'; // Keep hook import for mocking later
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

const mockNavigate = jest.fn(); 

// --- Mocks Ordering ---

// 1. React Native related mocks
jest.mock('react-native-screens', () => ({ enableScreens: jest.fn() }));

// 2. External library mocks
jest.mock('@expo/vector-icons', () => {
  // Require RNText inside the factory
  const { Text: RNText } = require('react-native');
  // Simple functional component mock for icons
  const MockIconComponent = (props: any) => {
    return <RNText testID={props.testID || `icon-${props.name}`}>{props.name || 'icon'}</RNText>;
  };
  MockIconComponent.displayName = 'MockExpoIcon';

  return {
    MaterialCommunityIcons: MockIconComponent,
    __esModule: true,
    default: MockIconComponent, 
  };
});

jest.mock('react-native-paper', () => {
    // Only import what's strictly needed from the actual module
    const actualPaper = jest.requireActual('react-native-paper');
    // Require React and RN components inside the factory
    const React = require('react');
    const { View, TextInput: RNTextInput, Text: RNText, TouchableOpacity } = require('react-native');

    // Mock TextInput
    const MockTextInput = ({
      placeholder,
      value,
      onChangeText,
      testID,
      label,
      secureTextEntry, // 受け取る
      right,          // 受け取る
      ...rest
    }: any) => {
      const { View, TextInput: MockInput, Text: RNText } = jest.requireActual('react-native');
      const RightComponent = right; // right prop (TextInput.Icon のはず)

      return (
        <View>
          {typeof label === 'string' && <RNText>{label}</RNText>}
          <MockInput
            placeholder={placeholder || label} // Paperのlabelもplaceholderとして使う場合があるため考慮
            value={value}
            onChangeText={onChangeText}
            testID={testID}
            secureTextEntry={secureTextEntry} // 渡す
            {...rest} // 他のプロパティも念のため渡す（secureTextEntryなど）
          />
          {/* right プロップとして渡されたコンポーネントをレンダリング */}
          {RightComponent}
        </View>
      );
    };
    MockTextInput.displayName = 'MockPaperTextInput';

    // TextInput.Icon のモック (TouchableOpacity に変更し、testID と onPress を追加)
    MockTextInput.Icon = ({ icon, testID, onPress, ...props }: any) => { // onPress も受け取る
      const MockTouchable = jest.requireActual('react-native').TouchableOpacity; // TouchableOpacity に変更
      // testID を icon の値に基づいて設定（もし testID が直接渡されていればそちらを優先）
      const finalTestID = testID || `text-input-icon-${icon}`; // testID を生成
      return <MockTouchable testID={finalTestID} onPress={onPress} {...props} />; // onPress を渡す
    };
    // TextInput.Affix のモックも View に変更
    MockTextInput.Affix = (props: any) => {
      const MockView = jest.requireActual('react-native').View;
      return <MockView {...props} />;
    };

    // Mock Button
    const MockButton = ({ children, onPress, testID, ...rest }: any) => (
        <TouchableOpacity onPress={onPress} testID={testID || 'mock-paper-button'} {...rest}>
            {typeof children === 'string' ? <RNText>{children}</RNText> : children}
        </TouchableOpacity>
    );
    MockButton.displayName = 'MockPaperButton';

    // Mock Text
    const MockText = (props: any) => {
        return <RNText {...props}>{props.children}</RNText>;
    };
    MockText.displayName = 'MockPaperText';

    // ADDED: Mock HelperText (used in LoginScreen for errors)
    const MockHelperText = ({ children, visible, type, ...rest }: any) => {
      if (!visible) return null;
      // Provide a simple Text element for the helper text, include type for context
      return <RNText {...rest} testID={`mock-helper-text-${type}`}>{children}</RNText>;
    };
    MockHelperText.displayName = 'MockPaperHelperText';

    return {
        // Explicitly provide needed exports
        PaperProvider: actualPaper.PaperProvider,
        MD3LightTheme: actualPaper.MD3LightTheme,
        useTheme: () => actualPaper.MD3LightTheme, // Provide the theme directly
        TextInput: MockTextInput, // Use mocked version
        Button: MockButton,       // Use mocked version
        Text: MockText,           // Use mocked version
        HelperText: MockHelperText, // Use mocked version
        // CRITICAL: Do NOT spread ...actualPaper
    };
});

const mockSignIn = jest.fn(() => Promise.resolve());
const mockSignInAnonymously = jest.fn(() => Promise.resolve());
const mockSignOut = jest.fn();
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    signIn: mockSignIn, 
    signInAnonymously: mockSignInAnonymously, 
    signOut: mockSignOut,
    signUp: jest.fn(() => Promise.resolve()),
  }),
}));

const theme = MD3LightTheme;

describe('LoginScreen', () => {
  beforeEach(() => {
    mockSignIn.mockClear();
    mockSignInAnonymously.mockClear();
    mockSignOut.mockClear();
    mockNavigate.mockClear();
  });

  const renderLoginScreen = () => {
    return render(
      <PaperProvider theme={theme}>
        <LoginScreen
          navigation={{ navigate: jest.fn() } as any}
          route={{ params: {} } as any} // Provide a basic route object if needed
        />
      </PaperProvider>
    );
  };

  it('アカウント作成ボタンを押すとSignupスクリーンにナビゲートする', async () => {
    // モックナビゲーションオブジェクトを作成
    const mockNavigationProp = {
      navigate: mockNavigate,
      // 必要に応じて他のナビゲーション関数も追加 (goBack, dispatch など)
    };

    // LoginScreen を直接レンダリングし、モック navigation と空の route を渡す
    render(
      <PaperProvider theme={MD3LightTheme}>
        <LoginScreen
          navigation={mockNavigationProp as any} // 型アサーションでエラー回避
          route={{} as any} // route プロパティも必要
        />
      </PaperProvider>
    );

    const signupButton = screen.getByText('アカウント作成');
    expect(signupButton).toBeTruthy(); // ボタンが存在することを確認

    await act(async () => {
      fireEvent.press(signupButton);
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('Signup');
  });

  it('初期表示時に必要なUI要素がレンダリングされる', () => {
    renderLoginScreen();
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('password-input')).toBeTruthy();
    expect(screen.getByText('ログイン')).toBeTruthy();
    expect(screen.getByText('アカウント作成')).toBeTruthy();
    expect(screen.getByText('匿名でログイン')).toBeTruthy();
    expect(screen.queryByTestId('mock-helper-text-error')).toBeNull();
  });

  it('メールアドレスとパスワードを入力できる', () => {
      renderLoginScreen();
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      // For controlled components, check the value prop
      expect(emailInput.props.value).toBe('test@example.com');
      expect(passwordInput.props.value).toBe('password123');
  });

  it('ログインボタンを押すとsignIn関数が正しい引数で呼び出される', async () => {
      renderLoginScreen();
      const emailInput = screen.getByPlaceholderText('メールアドレス');
      const passwordInput = screen.getByPlaceholderText('パスワード');
      const loginButton = screen.getByText('ログイン');
      const testEmail = 'user@test.com';
      const testPassword = 'securePassword';
      fireEvent.changeText(emailInput, testEmail);
      fireEvent.changeText(passwordInput, testPassword);
      await act(async () => {
          fireEvent.press(loginButton);
      });
      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledWith(testEmail, testPassword);
  });

  it('signIn がエラーを返した場合にエラーメッセージが表示される', async () => {
      const errorMessage = 'ログインに失敗しました。認証情報を確認してください。';
      mockSignIn.mockRejectedValueOnce(new Error(errorMessage));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      renderLoginScreen();
      const emailInput = screen.getByPlaceholderText('メールアドレス');
      const passwordInput = screen.getByPlaceholderText('パスワード');
      const loginButton = screen.getByText('ログイン');
      fireEvent.changeText(emailInput, 'wrong@example.com');
      fireEvent.changeText(passwordInput, 'wrongPassword');
      await act(async () => {
          fireEvent.press(loginButton);
      });
      const errorTextElement = await screen.findByTestId('mock-helper-text-error');
      expect(errorTextElement).toBeTruthy();
      expect(screen.getByText(errorMessage)).toBeTruthy();
      expect(mockSignIn).toHaveBeenCalledTimes(1);
      expect(mockSignIn).toHaveBeenCalledWith('wrong@example.com', 'wrongPassword');
      consoleErrorSpy.mockRestore();
  });

 it('メールアドレスまたはパスワードが空の場合にバリデーションエラーが表示される', async () => {
      renderLoginScreen();
      const loginButton = screen.getByText('ログイン');
      await act(async () => {
          fireEvent.press(loginButton);
      });
      const errorTextElement = await screen.findByTestId('mock-helper-text-error');
      expect(errorTextElement).toBeTruthy();
      expect(screen.getByText('メールアドレスとパスワードを入力してください')).toBeTruthy();
      expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('匿名でログインボタンを押すとsignInAnonymously関数が呼び出される', async () => {
      renderLoginScreen();
      const anonymousLoginButton = screen.getByText('匿名でログイン');
      await act(async () => {
          fireEvent.press(anonymousLoginButton);
      });
      expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
      expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('ログイン処理中にログインボタンが無効化される', async () => {
    // signIn が解決しないPromiseを返すようにモックを設定
    const unresolvingPromise: Promise<void> = new Promise(() => {}); // 型を明示的に指定
    mockSignIn.mockImplementationOnce(() => unresolvingPromise);

    renderLoginScreen();

    const emailInput = screen.getByPlaceholderText('メールアドレス');
    const passwordInput = screen.getByPlaceholderText('パスワード');
    const loginButton = screen.getByText('ログイン'); // getByText に変更

    // 入力
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    // ボタンをクリック
    // fireEvent.press は同期的だが、その後の状態更新が非同期なので act を使う
    await act(async () => {
        fireEvent.press(loginButton);
    });

    // ボタンが無効化されていることを確認
    // react-native-paper の Button は loading={true} のとき disabled={true} となる
    // @testing-library/jest-native の toBeDisabled() マッチャーを使用
    expect(loginButton).toBeDisabled();

    // オプショナル: もしActivityIndicatorが表示されるなら、それも確認できる
    // const activityIndicator = screen.queryByTestId('loading-indicator'); // testIDが必要
    // expect(activityIndicator).toBeTruthy();
  });
  
  it('パスワード表示切り替えアイコンをクリックすると表示/非表示が切り替わる', () => {
    renderLoginScreen();

    const passwordInput = screen.getByPlaceholderText('パスワード');
    // testID で初期アイコン (eye) を取得
    const eyeIcon = screen.getByTestId('text-input-icon-eye');

    // --- 1回目のクリック ---
    // 初期状態: 非表示のはず
    expect(passwordInput.props.secureTextEntry).toBe(true);

    // アイコンをクリック
    act(() => { // act で囲む
      fireEvent.press(eyeIcon);
    });

    // 状態確認: 表示されるはず
    expect(passwordInput.props.secureTextEntry).toBe(false);
    // アイコンが eye-off に切り替わっていることを確認
    expect(screen.getByTestId('text-input-icon-eye-off')).toBeTruthy();
    expect(screen.queryByTestId('text-input-icon-eye')).toBeNull(); // eye はもう存在しない

    // --- 2回目のクリック ---
    const eyeOffIcon = screen.getByTestId('text-input-icon-eye-off'); // eye-off アイコンを取得
    // もう一度クリック
    act(() => { // act で囲む
      fireEvent.press(eyeOffIcon);
    });

    // 状態確認: 非表示に戻るはず
    expect(passwordInput.props.secureTextEntry).toBe(true);
    // アイコンが eye に戻っていることを確認
    expect(screen.getByTestId('text-input-icon-eye')).toBeTruthy();
    expect(screen.queryByTestId('text-input-icon-eye-off')).toBeNull(); // eye-off はもう存在しない
  });

  it('匿名ログインが失敗した場合にエラーメッセージが表示される', async () => {
    const errorMessage = '匿名ログインに失敗しました。';
    mockSignInAnonymously.mockRejectedValueOnce(new Error(errorMessage));
    // 予想されるコンソールエラーを抑制
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderLoginScreen();

    const anonymousLoginButton = screen.getByText('匿名でログイン');

    // ボタンをクリック (非同期処理なので act と await を使用)
    await act(async () => {
      fireEvent.press(anonymousLoginButton);
    });

    // エラーメッセージが表示されるのを待つ
    const errorText = await screen.findByText(errorMessage);
    expect(errorText).toBeTruthy();

    // スパイを元に戻す
    consoleErrorSpy.mockRestore();
  });
 });
