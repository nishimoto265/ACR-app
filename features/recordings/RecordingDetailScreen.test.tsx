import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import RecordingDetailScreen from './RecordingDetailScreen';
import { useRecording } from '../../hooks/useRecordings';
import 'expo-av';
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
          playAsync: jest.fn().mockResolvedValue(undefined),
          pauseAsync: jest.fn().mockResolvedValue(undefined),
          setPositionAsync: jest.fn().mockResolvedValue(undefined),
        },
        status: { isLoaded: true, durationMillis: 60000 },
      }),
    },
  },
}));

const mockRoute = {
  key: 'RecordingDetailKey',
  name: 'RecordingDetail',
  params: { recordingId: 'test-recording-id' },
} as unknown as NativeStackScreenProps<RecordingsStackParamList, 'RecordingDetail'>['route'];

const mockNavigation = {
  navigate: jest.fn(),
} as unknown as NativeStackScreenProps<RecordingsStackParamList, 'RecordingDetail'>['navigation'];

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

    render(
      <PaperProvider>
        <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
      </PaperProvider>
    );

    expect(screen.getByText('データを読み込み中...')).toBeVisible();
  });

  it('renders error state correctly', () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(
      <PaperProvider>
        <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
      </PaperProvider>
    );

    expect(screen.getByText('データの読み込みに失敗しました。')).toBeVisible();
    expect(screen.getByText('再試行')).toBeVisible();
  });

  it('renders recording details correctly', () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: mockRecording,
      isLoading: false,
      isError: false,
    });

    render(
      <PaperProvider>
        <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
      </PaperProvider>
    );

    expect(screen.getByText('090-1234-5678')).toBeVisible();
    
    expect(screen.getByText('これはテスト用の文字起こしです。')).toBeVisible();
    
    expect(screen.getByText('テスト用の要約文です。')).toBeVisible();
    
    expect(screen.getByText('通話録音')).toBeVisible();
  });
});
