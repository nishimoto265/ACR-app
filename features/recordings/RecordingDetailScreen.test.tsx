import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { NavigationRoute } from '@react-navigation/native'; 
import { QueryClient, QueryClientProvider, UseQueryResult, QueryObserverResult } from '@tanstack/react-query';
import { Audio, AVPlaybackStatusSuccess } from 'expo-av';

// Mock expo-av FIRST
jest.mock('expo-av');

import RecordingDetailScreen from './RecordingDetailScreen'; 
// Define specific mock types instead of using 'any'
// TODO: Revert to specific types or import actual types when resolving navigation type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RecordingsStackParamList = any;
// type RecordingsStackParamList = {
//   RecordingDetail: { recordingId: string };
// };
type Recording = {
  id: string;
  name: string;
  audioUrl: string;
  durationMillis: number;
  recordedAt: string;
  isSynced: boolean;
  transcriptionStatus: string;
};
import { useRecording } from '../../hooks/useRecordings'; 
import { MOCK_DURATION_MILLIS, mockInitialSuccessStatus, MockSound } from '../../__mocks__/expo-av'; 

type TanstackQueryStatus = 'pending' | 'error' | 'success';

// Mock the custom hook
jest.mock('../../hooks/useRecordings', () => ({ 
  useRecording: jest.fn(), 
}));

// Mock navigation props - Add missing core methods required by the type
// TODO: Revert to specific type when resolving navigation type issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockNavigationProp = any; // NativeStackNavigationProp<RecordingsStackParamList, 'RecordingDetail'>;

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockSetParams = jest.fn();
const mockDispatch = jest.fn();
const mockSetOptions = jest.fn(); 
const mockReset = jest.fn();
// Add other functions if required by tests or component, otherwise jest.fn() suffices for type compliance

const mockNavigation: MockNavigationProp = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  setParams: mockSetParams,
  dispatch: mockDispatch,
  setOptions: mockSetOptions,
  reset: mockReset,
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
      key: 'stack-key',
      index: 0,
      routeNames: ['RecordingDetail'] as (keyof RecordingsStackParamList)[],
      routes: [
          { key: 'RecordingDetail-key', name: 'RecordingDetail', params: { recordingId: 'test-id-1' } }
      ] as NavigationRoute<RecordingsStackParamList, 'RecordingDetail'>[],
      type: 'stack',
      stale: false,
      history: [], 
      preloadedRoutes: [] as NavigationRoute<RecordingsStackParamList, keyof RecordingsStackParamList>[],
  })),
  addListener: jest.fn(() => jest.fn()), 
  removeListener: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  popTo: jest.fn(), 
  getId: jest.fn(),
  navigateDeprecated: jest.fn(),
  preload: jest.fn(),
  setStateForNextRouteNamesChange: jest.fn(),
};

// Helper to create mock query results matching discriminated union
const createMockQueryResult = (
  status: TanstackQueryStatus,
  data?: Recording | null,
  error?: Error | null
): UseQueryResult<Recording | null, Error> => {
  const baseResult: Omit<QueryObserverResult<Recording | null, Error>, 'status' | 'data' | 'error' | 'remove' | 'promise'> = {
    isFetching: false,
    isFetched: true,
    isStale: false,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isInitialLoading: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isFetchedAfterMount: true,
    isLoadingError: false,
    isPaused: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    refetch: jest.fn(),
    fetchStatus: 'idle',
    isPending: false,
  };

  switch (status) {
    case 'pending':
      return {
        ...baseResult,
        status: 'pending',
        fetchStatus: 'fetching',
        data: undefined,
        error: null,
        isLoading: true,
        isPending: true,
        isInitialLoading: true,
        isSuccess: false,
        isError: false,
        isFetched: false,
        isFetchedAfterMount: false,
        promise: new Promise(() => {}),
      } as UseQueryResult<Recording | null, Error>; 
    case 'success':
      return {
        ...baseResult,
        status: 'success',
        fetchStatus: 'idle',
        data: data === undefined ? null : data,
        error: null,
        isLoading: false,
        isPending: false,
        isInitialLoading: false,
        isSuccess: true,
        isError: false,
        dataUpdatedAt: Date.now(),
        promise: Promise.resolve(data === undefined ? null : data),
      } as UseQueryResult<Recording | null, Error>; 
    case 'error':
      const finalError = error || new Error('Mock Query Error');
      return {
        ...baseResult,
        status: 'error',
        fetchStatus: 'idle',
        data: undefined,
        error: finalError,
        isLoading: false,
        isPending: false,
        isInitialLoading: false,
        isSuccess: false,
        isError: true,
        errorUpdatedAt: Date.now(),
        failureCount: 1,
        failureReason: finalError,
        isLoadingError: true, 
        // Return a resolved promise instead of rejected to avoid potential unhandled rejections
        promise: Promise.resolve(null),
      } as UseQueryResult<Recording | null, Error>; 
    default:
      throw new Error(`Unhandled status: ${status}`);
  }
};

// Mock Recording Data (using defined Recording type)
const mockRecording: Recording = {
  id: 'test-id-1',
  name: 'Test Recording 1',
  audioUrl: 'file:///test/recording1.mp3',
  durationMillis: MOCK_DURATION_MILLIS, 
  recordedAt: new Date().toISOString(),
  isSynced: false,
  transcriptionStatus: 'pending',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRoute: any /* RouteProp<RecordingsStackParamList, 'RecordingDetail'> */ = {
  key: 'RecordingDetail-key',
  name: 'RecordingDetail',
  params: {
    recordingId: mockRecording.id,
  },
};

// Query Client for Tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, 
    },
  },
});

// Helper function to render the component with providers
const renderComponent = (mockQueryResult: UseQueryResult<Recording | null, Error>) => {
  (useRecording as jest.Mock).mockReturnValue(mockQueryResult); 
  return render(
    <QueryClientProvider client={queryClient}>
      <RecordingDetailScreen route={mockRoute} navigation={mockNavigation} />
    </QueryClientProvider>
  );
};

describe('RecordingDetailScreen', () => {
  let mockSound: MockSound;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Instantiate the MockSound class
    mockSound = new MockSound(mockInitialSuccessStatus);

    // Spy on methods if needed for specific call assertions
    jest.spyOn(mockSound, 'playAsync'); 
    jest.spyOn(mockSound, 'pauseAsync'); 
    jest.spyOn(mockSound, 'setPositionAsync'); 
    jest.spyOn(mockSound, 'unloadAsync');
    jest.spyOn(mockSound, 'setOnPlaybackStatusUpdate'); 

    // Mock the static Audio.Sound.createAsync method to return the instance
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: mockSound,
      status: mockInitialSuccessStatus,
    });

    (Audio.setAudioModeAsync as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    queryClient.clear();
  });

  it('renders loading state initially', async () => {
    renderComponent(createMockQueryResult('pending'));
    expect(screen.getByText('データを読み込み中...')).toBeTruthy();
  });

  it('renders error state', async () => {
    const error = new Error('Failed to fetch recording');
    renderComponent(createMockQueryResult('error', null, error));
    expect(await screen.findByText('データの読み込みに失敗しました。')).toBeTruthy();
    expect(await screen.findByText('再試行')).toBeTruthy();
  });

  it('displays recording details when data is loaded', async () => {
    renderComponent(createMockQueryResult('success', mockRecording));
    await waitFor(() => expect(Audio.Sound.createAsync).toHaveBeenCalled());
    expect(screen.getByTestId('total-duration-display').props.children).toEqual([' / ', '0:10']);
    expect(screen.getByLabelText(/play/i)).toBeTruthy();
  });

  it('loads audio on mount if recording data is available', async () => {
    renderComponent(createMockQueryResult('success', mockRecording));
    await waitFor(() => {
      expect(Audio.Sound.createAsync).toHaveBeenCalledWith(
        { uri: mockRecording.audioUrl },
        { shouldPlay: false, progressUpdateIntervalMillis: 500 }
      );
    });
  });

  it('plays and pauses audio when buttons are pressed', async () => {
    renderComponent(createMockQueryResult('success', mockRecording));
    await waitFor(() => expect(Audio.Sound.createAsync).toHaveBeenCalled());
    const playButton = screen.getByLabelText(/play/i);
    expect(playButton).toBeTruthy();

    await act(async () => { fireEvent.press(playButton); });
    await waitFor(() => expect(mockSound.playAsync).toHaveBeenCalledTimes(1));

    const playingStatus: AVPlaybackStatusSuccess = { ...mockInitialSuccessStatus, isPlaying: true, positionMillis: 500 };
    act(() => {
        // Cast explicitly to fix TS error
        const statusUpdateCallback = (mockSound.setOnPlaybackStatusUpdate as unknown as jest.SpyInstance).mock.calls[0][0];
        if (statusUpdateCallback) { statusUpdateCallback(playingStatus); }
    });
    await waitFor(() => expect(screen.getByLabelText(/pause/i)).toBeTruthy());

    const pauseButton = screen.getByLabelText(/pause/i);
    await act(async () => { fireEvent.press(pauseButton); });
    await waitFor(() => expect(mockSound.pauseAsync).toHaveBeenCalledTimes(1));

    const pausedStatus: AVPlaybackStatusSuccess = { ...playingStatus, isPlaying: false };
    act(() => {
        // Cast explicitly to fix TS error
        const statusUpdateCallback = (mockSound.setOnPlaybackStatusUpdate as unknown as jest.SpyInstance).mock.calls[0][0];
        if (statusUpdateCallback) { statusUpdateCallback(pausedStatus); }
    });
    await waitFor(() => expect(screen.getByLabelText(/play/i)).toBeTruthy());
  });

  it('updates slider and time display during playback', async () => {
    renderComponent(createMockQueryResult('success', mockRecording));
    await waitFor(() => expect(Audio.Sound.createAsync).toHaveBeenCalled());

    // Get the callback function passed to setOnPlaybackStatusUpdate via the spy
    // Cast explicitly to fix TS error
    const statusUpdateCallback = (mockSound.setOnPlaybackStatusUpdate as unknown as jest.SpyInstance).mock.calls[0][0];
    expect(statusUpdateCallback).toBeDefined();

    const halfwayMillis = MOCK_DURATION_MILLIS / 2;
    const halfwayStatus: AVPlaybackStatusSuccess = { ...mockInitialSuccessStatus, isLoaded: true, isPlaying: true, positionMillis: halfwayMillis, durationMillis: MOCK_DURATION_MILLIS };
    act(() => { if (statusUpdateCallback) { statusUpdateCallback(halfwayStatus); } });

    await waitFor(() => {
        expect(screen.getByTestId('current-time-display').props.children).toBe('0:05');
        expect(screen.getByTestId('total-duration-display').props.children).toEqual([' / ', '0:10']);
        const slider = screen.getByTestId('audio-slider');
        expect(slider.props.value).toBe(MOCK_DURATION_MILLIS / 1000 / 2);
    });
  });

  it('seeks audio when slider is moved', async () => {
    renderComponent(createMockQueryResult('success', mockRecording));
    await waitFor(() => expect(Audio.Sound.createAsync).toHaveBeenCalled());
    const slider = screen.getByTestId('audio-slider');
    const seekPositionSeconds = 5;

    // Simulate user sliding and releasing the slider
    // Note: fireEvent.changeValue might be needed for some slider implementations
    fireEvent(slider, 'onValueChange', seekPositionSeconds); // Simulate dragging
    await act(async () => { fireEvent(slider, 'onSlidingComplete', seekPositionSeconds); });
    await waitFor(() => { expect(mockSound.setPositionAsync).toHaveBeenCalledWith(seekPositionSeconds * 1000); });

    const seekedStatus: AVPlaybackStatusSuccess = { ...mockInitialSuccessStatus, positionMillis: seekPositionSeconds * 1000 }; 
    act(() => {
        // Get the callback function passed to setOnPlaybackStatusUpdate via the spy
        // Cast explicitly to fix TS error
        const statusUpdateCallback = (mockSound.setOnPlaybackStatusUpdate as unknown as jest.SpyInstance).mock.calls[0][0];
        if (statusUpdateCallback) { statusUpdateCallback(seekedStatus); }
    });
    await waitFor(() => {
      const currentTimeText = screen.getByTestId('current-time-display').props.children;
      expect(currentTimeText === '0:05').toBeTruthy();
    });
  });

  it('unloads audio on unmount', async () => {
    const { unmount } = renderComponent(createMockQueryResult('success', mockRecording));
    await waitFor(() => expect(Audio.Sound.createAsync).toHaveBeenCalled());
    unmount();
    await waitFor(() => expect(mockSound.unloadAsync).toHaveBeenCalledTimes(1));
  });
});
