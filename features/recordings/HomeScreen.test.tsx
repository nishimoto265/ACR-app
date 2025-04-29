import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import HomeScreen from './HomeScreen';
import { useRecordings, useSearchRecordings } from '../../hooks/useRecordings';
import { formatDate } from '../../utils/dateFormatter';

jest.mock('../../hooks/useRecordings', () => ({
  useRecordings: jest.fn(),
  useSearchRecordings: jest.fn(),
}));

jest.mock('../../utils/dateFormatter', () => ({
  formatDate: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
};

const mockRoute = {
  key: 'Home',
  name: 'Home',
};

const mockRecordings = [
  {
    id: 'rec1',
    phoneNumber: '090-1234-5678',
    recordedAt: new Date('2024-04-01T10:00:00'),
    duration: 60,
    audioUrl: 'https://example.com/audio1.mp3',
    transcript: 'これはテスト用の文字起こしです。',
    summary: 'テスト用の要約文です。',
  },
  {
    id: 'rec2',
    phoneNumber: '080-9876-5432',
    recordedAt: new Date('2024-04-02T15:30:00'),
    duration: 120,
    audioUrl: 'https://example.com/audio2.mp3',
    transcript: '別のテスト用の文字起こしです。',
    summary: '別のテスト用の要約文です。',
  },
];

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRecordings as jest.Mock).mockReturnValue({
      data: mockRecordings,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    
    (useSearchRecordings as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    
    (formatDate as jest.Mock).mockImplementation((date) => {
      return date instanceof Date ? date.toLocaleDateString('ja-JP') : 'Invalid date';
    });
  });

  it('renders correctly with recordings data', () => {
    render(
      <PaperProvider>
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </PaperProvider>
    );

    expect(screen.getByPlaceholderText('電話番号で検索')).toBeVisible();
    expect(screen.getByText('090-1234-5678')).toBeVisible();
    expect(screen.getByText('080-9876-5432')).toBeVisible();
  });

  it('renders loading state correctly', () => {
    (useRecordings as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(
      <PaperProvider>
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </PaperProvider>
    );

    expect(screen.getByText('データを読み込み中...')).toBeVisible();
  });

  it('renders error state correctly', () => {
    (useRecordings as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(
      <PaperProvider>
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </PaperProvider>
    );

    expect(screen.getByText('データの読み込みに失敗しました。 下にスワイプして再読み込みしてください。')).toBeVisible();
  });

  it('renders empty state correctly', () => {
    (useRecordings as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });

    render(
      <PaperProvider>
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </PaperProvider>
    );

    expect(screen.getByText('録音データがありません')).toBeVisible();
  });

  it('navigates to recording detail when a recording is pressed', () => {
    render(
      <PaperProvider>
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </PaperProvider>
    );

    fireEvent.press(screen.getByText('090-1234-5678'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('RecordingDetail', { recordingId: 'rec1' });
  });

  it('handles search correctly', async () => {
    const mockSearchResults = [mockRecordings[0]]; // Only the first recording matches
    
    (useSearchRecordings as jest.Mock).mockReturnValue({
      data: mockSearchResults,
      isLoading: false,
    });

    render(
      <PaperProvider>
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </PaperProvider>
    );

    const searchBar = screen.getByPlaceholderText('電話番号で検索');
    fireEvent.changeText(searchBar, '090');
    
    await waitFor(() => {
      expect(useSearchRecordings).toHaveBeenCalledWith('090', 20);
    });
    
    expect(screen.getByText('090-1234-5678')).toBeVisible();
    expect(screen.queryByText('080-9876-5432')).toBeNull();
  });

  it('shows search loading state correctly', () => {
    (useRecordings as jest.Mock).mockReturnValue({
      data: mockRecordings,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    });
    
    (useSearchRecordings as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(
      <PaperProvider>
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </PaperProvider>
    );

    const searchBar = screen.getByPlaceholderText('電話番号で検索');
    fireEvent.changeText(searchBar, '090');
    
    expect(screen.getByText('データを読み込み中...')).toBeVisible();
  });

  it('shows empty search results message correctly', async () => {
    (useSearchRecordings as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <PaperProvider>
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </PaperProvider>
    );

    const searchBar = screen.getByPlaceholderText('電話番号で検索');
    fireEvent.changeText(searchBar, 'nonexistent');
    
    await waitFor(() => {
      expect(useSearchRecordings).toHaveBeenCalledWith('nonexistent', 20);
    });
    
    expect(screen.getByText('検索結果が見つかりませんでした')).toBeVisible();
  });

  it('provides refetch function for pull-to-refresh', () => {
    const mockRefetch = jest.fn();
    
    (useRecordings as jest.Mock).mockReturnValue({
      data: mockRecordings,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isRefetching: false,
    });

    render(
      <PaperProvider>
        <HomeScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </PaperProvider>
    );
    
    expect(mockRefetch).not.toHaveBeenCalled();
    
    expect(useRecordings).toHaveBeenCalled();
  });
});
