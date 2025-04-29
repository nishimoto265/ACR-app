import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import SettingsScreen from './SettingsScreen';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  clear: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
  },
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('SettingsScreen', () => {
  const mockSignOut = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAuth as jest.Mock).mockReturnValue({
      signOut: mockSignOut,
    });
  });

  it('renders correctly', () => {
    render(
      <PaperProvider>
        <SettingsScreen />
      </PaperProvider>
    );

    expect(screen.getByText('アプリ設定')).toBeVisible();
    expect(screen.getByText('ハイコントラストモード')).toBeVisible();
    expect(screen.getByText('キャッシュを削除')).toBeVisible();
    expect(screen.getByText('ログアウト')).toBeVisible();
    expect(screen.getByText('バージョン: 1.0.0')).toBeVisible();
  });

  it('toggles high contrast mode when switch is pressed', () => {
    render(
      <PaperProvider>
        <SettingsScreen />
      </PaperProvider>
    );

    const switchComponent = screen.getByRole('switch');
    expect(switchComponent.props.value).toBe(false);
    
    fireEvent(switchComponent, 'valueChange', true);
    
    expect(switchComponent.props.value).toBe(true);
  });

  it('shows alert when clear cache button is pressed', () => {
    render(
      <PaperProvider>
        <SettingsScreen />
      </PaperProvider>
    );

    fireEvent.press(screen.getByText('キャッシュを削除'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'キャッシュを削除',
      'オフラインキャッシュを削除しますか？\nこの操作は元に戻せません。',
      expect.arrayContaining([
        expect.objectContaining({ text: 'キャンセル' }),
        expect.objectContaining({ text: '削除' }),
      ])
    );
  });

  it('clears cache when confirmed', async () => {
    render(
      <PaperProvider>
        <SettingsScreen />
      </PaperProvider>
    );

    fireEvent.press(screen.getByText('キャッシュを削除'));
    
    const alertMock = Alert.alert as jest.Mock;
    const deleteButtonCallback = alertMock.mock.calls[0][2][1].onPress;
    
    await deleteButtonCallback();
    
    expect(AsyncStorage.clear).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('完了', 'キャッシュを削除しました');
  });

  it('handles cache clear error', async () => {
    (AsyncStorage.clear as jest.Mock).mockRejectedValue(new Error('Clear failed'));
    
    render(
      <PaperProvider>
        <SettingsScreen />
      </PaperProvider>
    );

    fireEvent.press(screen.getByText('キャッシュを削除'));
    
    const alertMock = Alert.alert as jest.Mock;
    const deleteButtonCallback = alertMock.mock.calls[0][2][1].onPress;
    
    await deleteButtonCallback();
    
    expect(AsyncStorage.clear).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('エラー', 'キャッシュの削除に失敗しました');
  });

  it('shows alert when logout button is pressed', () => {
    render(
      <PaperProvider>
        <SettingsScreen />
      </PaperProvider>
    );

    fireEvent.press(screen.getByText('ログアウト'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'ログアウト',
      'ログアウトしますか？',
      expect.arrayContaining([
        expect.objectContaining({ text: 'キャンセル' }),
        expect.objectContaining({ text: 'ログアウト' }),
      ])
    );
  });

  it('calls signOut when logout is confirmed', async () => {
    render(
      <PaperProvider>
        <SettingsScreen />
      </PaperProvider>
    );

    fireEvent.press(screen.getByText('ログアウト'));
    
    const alertMock = Alert.alert as jest.Mock;
    const logoutButtonCallback = alertMock.mock.calls[0][2][1].onPress;
    
    await logoutButtonCallback();
    
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('handles signOut error', async () => {
    mockSignOut.mockRejectedValue(new Error('Signout failed'));
    
    render(
      <PaperProvider>
        <SettingsScreen />
      </PaperProvider>
    );

    fireEvent.press(screen.getByText('ログアウト'));
    
    const alertMock = Alert.alert as jest.Mock;
    const logoutButtonCallback = alertMock.mock.calls[0][2][1].onPress;
    
    await logoutButtonCallback();
    
    expect(mockSignOut).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('エラー', 'ログアウトに失敗しました');
  });
});
