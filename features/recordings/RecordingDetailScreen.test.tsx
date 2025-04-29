import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import RecordingDetailScreen from './RecordingDetailScreen';
import { useRecording } from '../../hooks/useRecordings';
import { RecoilRoot } from 'recoil';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RecordingsStackParamList } from '../../navigation/MainNavigator';

jest.mock('../../hooks/useRecordings', () => ({
  useRecording: jest.fn(),
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

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot>
    <PaperProvider>
      {children}
    </PaperProvider>
  </RecoilRoot>
);
TestWrapper.displayName = 'TestWrapper';

describe('RecordingDetailScreen', () => {
  jest.useFakeTimers();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('renders loading state correctly', async () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(
      <TestWrapper>
        <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
      </TestWrapper>
    );

    expect(await screen.findByText('データを読み込み中...')).toBeTruthy();
  });

  it('renders error state correctly', async () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(
      <TestWrapper>
        <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
      </TestWrapper>
    );

    expect(await screen.findByText('データの読み込みに失敗しました。')).toBeTruthy();
  });

  it('renders recording details correctly', async () => {
    (useRecording as jest.Mock).mockReturnValue({
      data: mockRecording,
      isLoading: false,
      isError: false,
    });

    render(
      <TestWrapper>
        <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
      </TestWrapper>
    );

    expect(await screen.findByText('090-1234-5678')).toBeTruthy();
    expect(await screen.findByText('これはテスト用の文字起こしです。')).toBeTruthy();
    expect(await screen.findByText('テスト用の要約文です。')).toBeTruthy();
  });
});
