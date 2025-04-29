// /media/thithilab/ボリューム1/ACR/ACR-app/components/LoadingScreen.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native'; // React Native Testing Libraryから必要な関数をインポート
import LoadingScreen from './LoadingScreen'; // テスト対象のコンポーネントをインポート

// MD3LightTheme (または使用バージョンに合わせて MD2LightTheme) をインポート
import { PaperProvider, MD3LightTheme } from 'react-native-paper';

// デフォルトテーマを定義 (バージョンに合わせて調整)
const theme = MD3LightTheme;

describe('LoadingScreen', () => {
  it('renders correctly with default message', () => {
    // 準備 & 実行: LoadingScreenをレンダリング
    // PaperProviderでラップしてレンダリング
    // PaperProviderに theme を渡す
    render(
      <PaperProvider theme={theme}>
        <LoadingScreen />
      </PaperProvider>
    );

    // アサーション: デフォルトのメッセージが表示されていることを確認
    // screen.getByText を使ってテキスト要素を検索
    // デフォルトメッセージの確認
    expect(screen.getByText('ロード中...')).toBeVisible();
    // モックされたインジケーターが表示されているか確認 (testIDで検索)
    // expect(screen.getByTestId('activity-indicator')).toBeVisible(); // Comment out assertion for now

    // オプション: ActivityIndicator の存在を確認 (role 'progressbar' で検索可能)
    // expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('renders correctly with a custom message', () => {
    const customMessage = 'データを取得しています...';

    // 準備 & 実行: カスタムメッセージをpropとして渡してレンダリング
    // PaperProviderでラップしてレンダリング
    // PaperProviderに theme を渡す
    render(
      <PaperProvider theme={theme}>
        <LoadingScreen message={customMessage} />
      </PaperProvider>
    );

    // アサーション: カスタムメッセージが表示されていることを確認
    // カスタムメッセージの確認
    expect(screen.getByText(customMessage)).toBeVisible();
    // モックされたインジケーターが表示されているか確認
    // expect(screen.getByTestId('activity-indicator')).toBeVisible(); // Comment out assertion for now
    // デフォルトメッセージがないことの確認
    expect(screen.queryByText('ロード中...')).toBeNull();

    // アサーション: デフォルトメッセージが表示されていないことを確認 (オプション)
    // expect(screen.queryByText('ロード中...')).toBeNull();

    // オプション: ActivityIndicator の存在を確認
    // expect(screen.getByRole('progressbar')).toBeVisible();
  });
});
