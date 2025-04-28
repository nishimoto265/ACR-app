// /media/thithilab/ボリューム1/ACR/ACR-app/components/ErrorBoundary.test.tsx
import React from 'react'; 
import { render, screen, fireEvent } from '@testing-library/react-native';
import { View, Text } from 'react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper'; 
import * as Sentry from '@sentry/react-native';
import { ErrorBoundary } from './ErrorBoundary'; 

// Sentry と console.error をモック
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
}));
// console.error のモックを一時的にコメントアウト
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

// エラーをスローするテスト用コンポーネント（シンプルな実装に戻す）
const BuggyComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test Error');
  }
  return <Text>正常なコンテンツ</Text>;
};

const theme = MD3LightTheme;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockClear();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('子コンポーネントでエラーがない場合は、子コンポーネントをそのままレンダリングする', () => {
    render(
      <PaperProvider theme={theme}>
        <ErrorBoundary>
          <BuggyComponent shouldThrow={false} /> 
        </ErrorBoundary>
      </PaperProvider>
    );
    expect(screen.getByText('正常なコンテンツ')).toBeVisible();
    expect(screen.queryByText('エラーが発生しました')).toBeNull();
  });

  it('子コンポーネントでエラーが発生した場合、フォールバックUIを表示し、エラーをログとSentryに送信する', () => {
    render(
      <PaperProvider theme={theme}>
        <ErrorBoundary>
           <BuggyComponent shouldThrow={true} /> 
        </ErrorBoundary>
      </PaperProvider>
    );
    expect(screen.getByText('エラーが発生しました')).toBeVisible();
    expect(screen.getByText('Test Error')).toBeVisible();
    expect(screen.getByText('アプリを再起動')).toBeVisible();
    expect(screen.queryByText('正常なコンテンツ')).toBeNull();
    expect(consoleErrorSpy as jest.Mock).toHaveBeenCalledTimes(2);
    expect(Sentry.captureException as jest.Mock).toHaveBeenCalledTimes(1);
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
  });

  it('「アプリを再起動」ボタンクリック後、キー変更による再マウント後に正常なコンテンツが表示される', async () => {
    const ThrowingChild = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test Error');
      }
      return <Text>元の正常なコンテンツ</Text>; // 区別のため少し変更
    };

    // Initial render with key="initial"
    const { rerender } = render(
      <PaperProvider theme={theme}>
        <ErrorBoundary key="initial"> {/* Add initial key */}
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      </PaperProvider>
    );

    // エラー発生を確認
    expect(screen.getByText('エラーが発生しました')).toBeVisible();
    expect(Sentry.captureException as jest.Mock).toHaveBeenCalledTimes(1); // Initial call

    // 再起動ボタンをクリック
    fireEvent.press(screen.getByText('アプリを再起動'));

    // rerender の直前に Sentry モックをクリア
    (Sentry.captureException as jest.Mock).mockClear();

    // --- key を変更して ErrorBoundary を再マウント ---
    rerender(
      <PaperProvider theme={theme}>
        <ErrorBoundary key="reset"> {/* Change the key */}
          <Text>新しい正常なコンテンツ</Text> {/* 新しい子 */}
        </ErrorBoundary>
      </PaperProvider>
    );
    // ---------------------------------------------

    // フォールバックUIがないこと、新しいコンテンツがあることを確認
    expect(screen.queryByText('エラーが発生しました')).toBeNull();
    expect(screen.queryByText('Test Error')).toBeNull();
    // screen.findByText を使用
    expect(await screen.findByText('新しい正常なコンテンツ')).toBeVisible();

    // Sentry が再度呼ばれていないことを確認
    expect(Sentry.captureException as jest.Mock).not.toHaveBeenCalled(); // Changed assertion
  });

  it('エラーメッセージがない場合、デフォルトのエラーメッセージを表示する', () => {
    const ErrorWithoutMessage = () => {
       throw new Error();
    };

    render(
      <PaperProvider theme={theme}>
        <ErrorBoundary>
          <ErrorWithoutMessage />
        </ErrorBoundary>
      </PaperProvider>
    );
    expect(screen.getByText('エラーが発生しました')).toBeVisible();
    expect(screen.getByText('アプリケーションで問題が発生しました。')).toBeVisible();
    expect(consoleErrorSpy as jest.Mock).toHaveBeenCalledTimes(2);
    expect(Sentry.captureException as jest.Mock).toHaveBeenCalledTimes(1);
  });
});
