import React from 'react';
import { render } from '@testing-library/react-native';
import RecordingDetailScreen from './RecordingDetailScreen';
import { useRecording } from '../../hooks/useRecordings';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RecordingsStackParamList } from '../../navigation/MainNavigator';

jest.mock('../../hooks/useRecordings', () => ({
  useRecording: jest.fn(),
}));

jest.mock('expo-av', () => ({}));

jest.mock('../../utils/dateFormatter', () => ({
  formatDate: jest.fn().mockReturnValue('2024年4月1日'),
  formatDuration: jest.fn().mockImplementation((seconds) => {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }),
}));

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

describe('RecordingDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    const { getByText } = render(
      <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('データを読み込み中...')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    const { getByText } = render(
      <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('データの読み込みに失敗しました。')).toBeTruthy();
    expect(getByText('再試行')).toBeTruthy();
  });

  it('renders recording details correctly', () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: mockRecording,
      isLoading: false,
      isError: false,
    });

    const { getByText } = render(
      <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
    );

    expect(getByText('090-1234-5678')).toBeTruthy();
    
    expect(getByText('これはテスト用の文字起こしです。')).toBeTruthy();
    
    expect(getByText('テスト用の要約文です。')).toBeTruthy();
    
    expect(getByText('通話録音')).toBeTruthy();
  });
});
