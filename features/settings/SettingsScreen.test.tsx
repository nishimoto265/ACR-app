import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import SettingsScreen from './SettingsScreen';
import { useAuth } from '../../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from '../auth/AuthProvider';

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

jest.mock('../auth/AuthProvider', () => ({
  ...(jest.requireActual('../auth/AuthProvider')),
  useAuth: jest.fn(),
}));

const renderWithProviders = (ui: React.ReactElement, { ...renderOptions } = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      <PaperProvider>{children}</PaperProvider>
    </AuthProvider>
  );
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

describe('SettingsScreen', () => {
  const mockSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      signOut: mockSignOut,
    });
  });

  it('renders correctly', () => {
    renderWithProviders(<SettingsScreen />);

    expect(screen.getByText('アプリ設定')).toBeVisible();
    expect(screen.getByText('ハイコントラストモード')).toBeVisible();
    expect(screen.getByText('キャッシュを削除')).toBeVisible();
    expect(screen.getByText('ログアウト')).toBeVisible();
    expect(screen.getByText('バージョン: 1.0.0')).toBeVisible();
  });

  it('toggles high contrast mode when switch is pressed', () => {
    renderWithProviders(<SettingsScreen />);

    const switchComponent = screen.getByRole('switch');
    expect(switchComponent.props.value).toBe(false);

    fireEvent(switchComponent, 'valueChange', true);

    expect(switchComponent.props.value).toBe(true);
  });

  it('shows alert when clear cache button is pressed', () => {
    renderWithProviders(<SettingsScreen />);

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
    renderWithProviders(<SettingsScreen />);

    fireEvent.press(screen.getByText('キャッシュを削除'));

    const alertMock = Alert.alert as jest.Mock;
    const alertArgs = alertMock.mock.calls[0];
    const confirmButton = alertArgs[2]?.find((button: { style?: string; onPress?: () => void | Promise<void> }) => button.style !== 'cancel');
    if (confirmButton?.onPress) {
      // Wrap the state-updating async operation in act
      await act(async () => {
        await confirmButton.onPress();
      });
    } else {
      throw new Error('Confirmation button or onPress not found in Alert mock');
    }

    expect(AsyncStorage.clear).toHaveBeenCalled();
    // Wait for the final alert triggered after async operation
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('完了', 'キャッシュを削除しました'));
  });

  it('handles cache clear error', async () => {
    (AsyncStorage.clear as jest.Mock).mockRejectedValue(new Error('Clear failed'));

    renderWithProviders(<SettingsScreen />);

    fireEvent.press(screen.getByText('キャッシュを削除'));

    const alertMock = Alert.alert as jest.Mock;
    const alertArgs = alertMock.mock.calls[0];
    const confirmButton = alertArgs[2]?.find((button: { style?: string; onPress?: () => void | Promise<void> }) => button.style !== 'cancel');
    if (confirmButton?.onPress) {
      // Wrap the state-updating async operation in act
      await act(async () => {
        await confirmButton.onPress();
      });
    } else {
      throw new Error('Confirmation button or onPress not found in Alert mock');
    }

    expect(AsyncStorage.clear).toHaveBeenCalled();
    // Wait for the final alert triggered after async operation
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('エラー', 'キャッシュの削除に失敗しました'));
  });

  it('shows alert when logout button is pressed', () => {
    renderWithProviders(<SettingsScreen />);

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

  it('logs out successfully', async () => {
    const alertMock = jest.spyOn(Alert, 'alert');

    const { getByText } = renderWithProviders(<SettingsScreen />);

    await act(async () => {
      const logoutButton = getByText('ログアウト');
      fireEvent.press(logoutButton);

      expect(alertMock).toHaveBeenCalled();
      const alertArgs = alertMock.mock.calls[0];
      const confirmButton = alertArgs[2]?.find(button => button.style !== 'cancel');
      if (confirmButton?.onPress) {
        confirmButton.onPress();
      } else {
        throw new Error('Confirmation button or onPress not found in Alert mock');
      }

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    alertMock.mockRestore();
  });

  it('handles signOut error', async () => {
    mockSignOut.mockRejectedValue(new Error('Signout failed'));

    renderWithProviders(<SettingsScreen />);

    fireEvent.press(screen.getByText('ログアウト'));

    const alertMock = Alert.alert as jest.Mock;
    const logoutButtonCallback = alertMock.mock.calls[0][2][1].onPress;

    await logoutButtonCallback();

    expect(mockSignOut).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('エラー', 'ログアウトに失敗しました');
  });
});
