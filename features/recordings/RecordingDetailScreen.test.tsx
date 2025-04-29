import React from 'react';
import { render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import RecordingDetailScreen from './RecordingDetailScreen';
import { useRecording } from '../../hooks/useRecordings';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RecordingsStackParamList } from '../../navigation/MainNavigator';

jest.mock('../../hooks/useRecordings', () => ({
  useRecording: jest.fn(),
}));

jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          unloadAsync: jest.fn().mockResolvedValue(undefined),
        },
        status: { isLoaded: true },
      }),
    },
  },
}));

jest.mock('../../utils/dateFormatter', () => ({
  formatDate: jest.fn().mockReturnValue('2024年4月1日'),
  formatDuration: jest.fn().mockReturnValue('1:00'),
}));

jest.spyOn(console, 'error').mockImplementation((message) => {
  if (message && message.includes('Warning: An update to RecordingDetailScreen inside a test was not wrapped in act')) {
    return;
  }
  console.warn(message);
});

describe('RecordingDetailScreen', () => {
  type RecordingDetailProps = NativeStackScreenProps<RecordingsStackParamList, 'RecordingDetail'>;
  
  const mockRoute = {
    key: 'RecordingDetail',
    name: 'RecordingDetail',
    params: { recordingId: 'test-recording-id' },
  } as RecordingDetailProps['route'];
  
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  } as unknown as RecordingDetailProps['navigation'];
  
  const mockRecording = {
    id: 'test-recording-id',
    phoneNumber: '090-1234-5678',
    recordedAt: new Date('2024-04-01T10:00:00'),
    duration: 60,
    audioUrl: 'https://example.com/test-recording.mp3',
    transcript: 'これはテスト用の文字起こしです。',
    summary: 'テスト用の要約文です。',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders loading state correctly', () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    const { queryByText } = render(
      <PaperProvider>
        <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
      </PaperProvider>
    );

    expect(queryByText('データを読み込み中...')).not.toBeNull();
  });

  test('renders error state correctly', () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    const { queryByText } = render(
      <PaperProvider>
        <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
      </PaperProvider>
    );

    expect(queryByText('データの読み込みに失敗しました。')).not.toBeNull();
    expect(queryByText('再試行')).not.toBeNull();
  });

  test('renders recording details correctly', () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: mockRecording,
      isLoading: false,
      isError: false,
    });

    const { queryByText } = render(
      <PaperProvider>
        <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
      </PaperProvider>
    );

    expect(queryByText('090-1234-5678')).not.toBeNull();
    expect(queryByText('これはテスト用の文字起こしです。')).not.toBeNull();
    expect(queryByText('テスト用の要約文です。')).not.toBeNull();
    expect(queryByText('通話録音')).not.toBeNull();
  });
});
