import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react-native";
import RecordingDetailScreen from "./RecordingDetailScreen";
import { Recording } from "../../services/recordings";
import { Audio, AVPlaybackStatus } from "expo-av";
import { UseQueryResult } from 'react-query';
import { formatDate } from "../../utils/dateFormatter";
import { RouteProp } from '@react-navigation/native'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; 
import type { RecordingsStackParamList } from '../../navigation/MainNavigator'; // Import the correct type

// --- Mocks ---
// Use fake timers for advancing time
// Temporarily disable fake timers for debugging
// jest.useFakeTimers();

// Helper to create a mock UseQueryResult object for react-query v3
type MockQueryOptions = {
  status: 'loading' | 'success' | 'error' | 'idle';
  data?: Recording;
  error?: unknown;
};

const createMockQueryResult = ({ 
  status, 
  data, 
  error 
}: MockQueryOptions): UseQueryResult<Recording, unknown> => {
  const baseResult = {
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: status === 'error' ? Date.now() : 0,
    errorUpdateCount: 0, // Add missing property required by UseQueryResult subtypes
    failureCount: status === 'error' ? 1 : 0,
    isFetched: status !== 'loading',
    isFetchedAfterMount: status !== 'loading',
    isFetching: status === 'loading',
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetching: false,
    isStale: false,
    refetch: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn(),
  };

  switch (status) {
    case 'loading':
      return {
        ...baseResult,
        status: 'loading',
        data: undefined,
        error: null,
        isError: false,
        isIdle: false,
        isLoading: true,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: false,
      };
    case 'success':
      return {
        ...baseResult,
        status: 'success',
        data: data ?? ({ id: 'default-success-id' } as Recording), // Provide default data if needed
        error: null,
        isError: false,
        isIdle: false,
        isLoading: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: true,
      };
    case 'error':
      return {
        ...baseResult,
        status: 'error',
        data: undefined,
        error: error ?? new Error('Mock query error'), // Provide default error
        isError: true,
        isIdle: false,
        isLoading: false,
        isLoadingError: true,
        isRefetchError: false,
        isSuccess: false,
      };
    case 'idle':
    default:
      return {
        ...baseResult,
        status: 'idle',
        data: undefined,
        error: null,
        isError: false,
        isIdle: true,
        isLoading: false,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: false,
      };
  }
};

// Helper to wait for audio loading state to resolve
// Increased default timeout and added logging
async function waitForAudioLoad(timeout = 5000) { // Increased default timeout
  try {
    await waitFor(
      async () => {
        // Use queryByRole for the button, keep queryByTestId for error
        const playPauseButton = screen.queryByRole('button', { name: /play|pause/i });
        const errorText = screen.queryByTestId("audio-error-text");
        // Debug: Log screen contents on each check
        screen.debug(); 
        // Use expect directly; waitFor retries until this passes or times out.
        expect(playPauseButton || errorText).toBeTruthy();
      },
      { timeout: timeout } // Pass the timeout option
    );
  } catch (error) {
    // This catch block might not be reliably hit, hence screen.debug() moved inside callback
    throw error; // Re-throw the timeout error
  }
}

// Helper to render the component with default mocks
const renderComponent = (recordingId = 'default-id') => { 
  // Properly type the mockRoute using RecordingsStackParamList
  const mockRoute: RouteProp<RecordingsStackParamList, 'RecordingDetail'> = {
    key: 'RecordingDetail-key',
    name: 'RecordingDetail',
    params: { recordingId }, // Use the passed recordingId
  };

  // Properly type the mockNavigation using RecordingsStackParamList
  const mockNavigation: Partial<NativeStackNavigationProp<RecordingsStackParamList, 'RecordingDetail'>> = {
    navigate: jest.fn(),
    // Add other navigation functions if the component uses them
  };

  return render(
    // Pass navigation and route props correctly
    <RecordingDetailScreen 
      route={mockRoute} 
      navigation={mockNavigation as NativeStackNavigationProp<RecordingsStackParamList, 'RecordingDetail'>} // Cast needed because we use Partial
    />
  );
};

// --- Mock Setup ---
// Mocking the hooks and modules
jest.mock("../../hooks/useRecordings", () => {
  const internalMockUseRecording = jest.fn(); // Define mock INSIDE factory
  return {
    __esModule: true, // Important for ES Modules
    useRecordings: jest.fn(),
    useRecording: internalMockUseRecording, // Use the internal mock
    useSearchRecordings: jest.fn(),
    __INTERNAL_MOCK_useRecording: internalMockUseRecording, // Export the internal mock
  };
});

import * as mockRecordingsHooks from '../../hooks/useRecordings';
const useRecording = (mockRecordingsHooks as any).__INTERNAL_MOCK_useRecording; // Cast to any to bypass TS error

// --- Mock expo-av (Refactored) ---
jest.mock("expo-av", () => {
  let mockCurrentPositionMillis = 0;
  let mockDurationMillis = 60000; // Default duration
  let mockIsPlaying = false;
  let mockCapturedCallback: ((status: AVPlaybackStatus) => void) | null = null;

  const baseMockLoadedStatus = (): AVPlaybackStatus => ({
    isLoaded: true, // Indicates success status
    uri: "mock-uri",
    progressUpdateIntervalMillis: 100,
    durationMillis: mockDurationMillis,
    positionMillis: mockCurrentPositionMillis,
    playableDurationMillis: mockDurationMillis,
    seekMillisToleranceBefore: 0,
    seekMillisToleranceAfter: 0,
    shouldPlay: false,
    isPlaying: mockIsPlaying,
    isBuffering: false,
    rate: 1.0,
    shouldCorrectPitch: false,
    volume: 1.0,
    isMuted: false,
    isLooping: false,
    didJustFinish: mockCurrentPositionMillis >= mockDurationMillis,
    audioPan: 0, // Add missing required property
  });

  const mockSoundInstanceMethods = {
    playAsync: jest.fn().mockImplementation(async () => {
      mockIsPlaying = true;
      // Simulate callback after state change
      if (mockCapturedCallback) mockCapturedCallback(baseMockLoadedStatus());
      return baseMockLoadedStatus();
    }),
    pauseAsync: jest.fn().mockImplementation(async () => {
      mockIsPlaying = false;
      // Simulate callback after state change
      if (mockCapturedCallback) mockCapturedCallback(baseMockLoadedStatus());
      return baseMockLoadedStatus();
    }),
    setPositionAsync: jest.fn().mockImplementation(async (positionMillis: number) => {
      const newPosition = Math.max(0, Math.min(positionMillis, mockDurationMillis));
      mockCurrentPositionMillis = newPosition;
      // Simulate callback after state change
      if (mockCapturedCallback) mockCapturedCallback(baseMockLoadedStatus());
      return baseMockLoadedStatus();
    }),
    getStatusAsync: jest.fn().mockImplementation(async () => {
      return baseMockLoadedStatus();
    }),
    unloadAsync: jest.fn().mockResolvedValue({ isLoaded: false } as AVPlaybackStatus),
    setOnPlaybackStatusUpdate: jest.fn((cb) => {
      mockCapturedCallback = cb;
    }),
  };

  const mockCreateAsync = jest.fn().mockImplementation(async (source, initialStatus, onPlaybackStatusUpdate) => {
    // Reset state on create
    mockCurrentPositionMillis = 0;
    mockIsPlaying = false;
    mockCapturedCallback = null; // Reset callback capture
    if (typeof onPlaybackStatusUpdate === 'function') {
      mockCapturedCallback = onPlaybackStatusUpdate; // Capture new callback
    }
    await Promise.resolve(); // Simulate async loading

    // Simulate the initial status update via the callback
    if (typeof mockCapturedCallback === 'function') {
      act(() => {
        mockCapturedCallback!(baseMockLoadedStatus()); // Add non-null assertion
      });
    }

    // Return the mock sound object and the initial status
    return { sound: mockSoundInstanceMethods, status: baseMockLoadedStatus };
  });

  const mockUtils = {
    resetMockState: () => {
      mockCurrentPositionMillis = 0;
      mockIsPlaying = false;
      mockCapturedCallback = null;
      // Reset mock function calls
      mockCreateAsync.mockClear();
      Object.values(mockSoundInstanceMethods).forEach(mockFn => mockFn.mockClear());
    },
    getMockSoundInstanceMethods: () => mockSoundInstanceMethods,
    getCurrentPosition: () => mockCurrentPositionMillis,
    getIsPlaying: () => mockIsPlaying,
    setDuration: (duration: number) => { mockDurationMillis = duration; },
    getCapturedCallback: () => mockCapturedCallback,
    setCurrentPosition: (pos: number) => { mockCurrentPositionMillis = pos; },
    setIsPlaying: (playing: boolean) => { mockIsPlaying = playing; }
  };

  return {
    __esModule: true, // Needed for ES Modules
    Audio: {
      Sound: {
        createAsync: mockCreateAsync,
      },
    },
    __mockUtils__: mockUtils, // Expose utils
  };
});

// --- Test Suites ---
describe("RecordingDetailScreen", () => {
  // Restore any spies after each test
  afterEach(() => {
    jest.restoreAllMocks();
    // Ensure fake timers are cleared between tests
    // try {
    //   jest.clearAllTimers(); // Clear any pending timers
    // } catch (e) {
    //   // Ignore errors if timers weren't used or already cleared
    // }
    const { __mockUtils__ } = Audio as any;
    if (__mockUtils__) {
      __mockUtils__.resetMockState();
    }
  });

  describe("Loading State", () => {
    test("shows loading indicator when data is loading", () => {
      useRecording.mockReturnValue(createMockQueryResult({ status: 'loading' }));
      renderComponent('default-id'); // Pass ID for consistency
      expect(screen.getByText("データを読み込み中...")).toBeTruthy();
    });
  });

  describe("Data Display", () => {
    test("renders recording details when data is loaded", () => {
      const mockAudioRecording = {
        id: "test-id-audio",
        phoneNumber: "090-5555-5555",
        recordedAt: new Date(),
        duration: 120,
        audioUrl: "https://example.com/real-audio.mp3", // Ensure URL is present
        transcript: "Audio player tests",
        summary: "Testing play, pause, seek",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      useRecording.mockReturnValue(createMockQueryResult({ status: 'success', data: mockAudioRecording as Recording }));
      renderComponent(mockAudioRecording.id);
      expect(screen.getByText(mockAudioRecording.phoneNumber)).toBeTruthy();
      // Use the actual formatter used by the component
      expect(screen.getByText(formatDate(mockAudioRecording.recordedAt))).toBeTruthy();
      expect(screen.getByText("Audio player tests")).toBeTruthy(); // Transcript
      expect(screen.getByText("Testing play, pause, seek")).toBeTruthy(); // Summary
    });
  });

  describe("Error State", () => {
    test("shows error message when data loading fails", () => {
      useRecording.mockReturnValue(createMockQueryResult({ status: 'error', error: new Error('Failed to load') }));
      renderComponent('default-id');
      expect(screen.getByText("データの読み込みに失敗しました。")).toBeTruthy();
    });

    test("shows audio loading error message when audio fails to load", async () => {
      // Provide valid recording data initially (success state for useRecording)
      const mockAudioRecording = {
        id: "test-id-audio",
        phoneNumber: "090-5555-5555",
        recordedAt: new Date(),
        duration: 120,
        audioUrl: "https://example.com/real-audio.mp3", // Ensure URL is present
        transcript: "Audio player tests",
        summary: "Testing play, pause, seek",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      useRecording.mockReturnValue(createMockQueryResult({ status: 'success', data: mockAudioRecording as Recording }));
      renderComponent(mockAudioRecording.id);

      // Wait for the error message to appear
      const errorMessage = await screen.findByText("音声ファイルの読み込みに失敗しました", {}, { timeout: 5000 });
      expect(errorMessage).toBeTruthy();
    });
  });

  describe("Audio Player", () => {
    // Increase timeout for this specific suite due to async operations
    jest.setTimeout(60000);

    // Reset the shared mock instance and configure mocks before each test
    beforeEach(async () => {
      const { __mockUtils__ } = Audio as any;
      if (__mockUtils__) {
        __mockUtils__.resetMockState();
      }
    });

    const mockAudioRecording = {
      id: "test-id-audio",
      phoneNumber: "090-5555-5555",
      recordedAt: new Date(),
      duration: 120,
      audioUrl: "https://example.com/real-audio.mp3", // Ensure URL is present
      transcript: "Audio player tests",
      summary: "Testing play, pause, seek",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    test("renders audio player controls when audio recording data is loaded", async () => {
      // Arrange: Mock successful data fetch with audio URL
      useRecording.mockReturnValue(createMockQueryResult({ status: 'success', data: mockAudioRecording as Recording }));
      renderComponent(mockAudioRecording.id);

      // Act: Wait for potential state updates after render
      // await act(async () => {
      //   jest.advanceTimersByTime(100); // Remove as fake timers are disabled
      // });

      // Wait for audio loading to complete
      await waitForAudioLoad();

      // Assert: Check initial state
      expect(screen.getByRole('button', { name: 'play' })).toBeTruthy(); // Corrected label
      expect(screen.queryByRole('button', { name: 'pause' })).toBeNull(); // Corrected label
    });

    test("toggles play/pause state correctly", async () => { 
      // Arrange: Render component and wait for audio load
      useRecording.mockReturnValue(createMockQueryResult({ status: "success", data: mockAudioRecording as Recording }));
      renderComponent(mockAudioRecording.id);
      await waitFor(() => expect(screen.getByText("0:00 / 1:00")).toBeTruthy());

      const { __mockUtils__ } = Audio as any;
      const { getMockSoundInstanceMethods, getCapturedCallback, baseMockLoadedStatus } = __mockUtils__;

      // --- Act: Press Play ---
      const playButton = screen.getByRole("button", { name: "play" });
      await act(async () => {
        fireEvent.press(playButton);
        // Simulate the initial playing status update
        if (getCapturedCallback()) {
          getCapturedCallback()({ ...baseMockLoadedStatus(), isPlaying: true });
        }
      });

      // Assert playAsync was called
      expect(getMockSoundInstanceMethods().playAsync).toHaveBeenCalledTimes(1);

      // Check button changes to pause
      const pauseButton = await screen.findByRole("button", { name: "pause" });
      expect(pauseButton).toBeTruthy();

      // --- Act: Press Pause ---
      await act(async () => {
        fireEvent.press(pauseButton);
        // Simulate callback for pause
        if (getCapturedCallback()) {
          getCapturedCallback()({ ...baseMockLoadedStatus(), isPlaying: false });
        }
      });

      // Assert pauseAsync was called
      expect(getMockSoundInstanceMethods().pauseAsync).toHaveBeenCalledTimes(1);

      // Check button changes back to play
      const playButtonAgain = await screen.findByRole("button", { name: "play" });
      expect(playButtonAgain).toBeTruthy();
    });

    test("calls setPositionAsync when seek buttons are pressed", async () => {
      // Arrange
      useRecording.mockReturnValue(createMockQueryResult({ status: "success", data: mockAudioRecording as Recording }));
      renderComponent(mockAudioRecording.id);
      await waitFor(() => expect(screen.getByText("0:00 / 1:00")).toBeTruthy());

      const { __mockUtils__ } = Audio as any;
      const { getMockSoundInstanceMethods, getCurrentPosition } = __mockUtils__;

      const rewindButton = screen.getByRole("button", { name: "rewind-10" });
      const forwardButton = screen.getByRole("button", { name: "fast-forward-10" });

      expect(getMockSoundInstanceMethods().setPositionAsync).not.toBeNull();

      // --- Press Rewind (should not go below 0) ---
      await act(async () => {
        fireEvent.press(rewindButton);
      });
      // Assert setPositionAsync was called with clamped value
      // Position starts at 0, rewind 10s -> stays at 0
      expect(getMockSoundInstanceMethods().setPositionAsync).toHaveBeenCalledWith(0);
      expect(getCurrentPosition()).toBe(0);

      // --- Press Forward ---
      await act(async () => {
        fireEvent.press(forwardButton);
      });
      // Position 0, forward 10s -> 10000ms
      expect(getMockSoundInstanceMethods().setPositionAsync).toHaveBeenCalledWith(10000);
      // Note: setPositionAsync mock updates the internal position
      expect(getCurrentPosition()).toBe(10000);

      // --- Press Forward again ---
      await act(async () => {
        fireEvent.press(forwardButton);
      });
      // Position 10000, forward 10s -> 20000ms
      expect(getMockSoundInstanceMethods().setPositionAsync).toHaveBeenCalledWith(20000);
      expect(getCurrentPosition()).toBe(20000);

      // --- Press Rewind ---
      await act(async () => {
        fireEvent.press(rewindButton);
      });
      // Position 20000, rewind 10s -> 10000ms
      expect(getMockSoundInstanceMethods().setPositionAsync).toHaveBeenCalledWith(10000);
      expect(getCurrentPosition()).toBe(10000);
    });

    test("updates position display during playback", async () => {
      // Arrange
      useRecording.mockReturnValue(createMockQueryResult({ status: "success", data: mockAudioRecording as Recording }));
      renderComponent(mockAudioRecording.id);
      await waitFor(() => expect(screen.getByText("0:00 / 1:00")).toBeTruthy());

      const { __mockUtils__ } = Audio as any;
      const { getCapturedCallback, baseMockLoadedStatus } = __mockUtils__;

      // --- Act: Start Playback ---
      const playButton = screen.getByRole("button", { name: "play" });
      await act(async () => {
        fireEvent.press(playButton);
        // Simulate the initial playing status update
        if (getCapturedCallback()) {
          getCapturedCallback()({ ...baseMockLoadedStatus(), isPlaying: true, positionMillis: 0 });
        }
      });

      // Simulate playback progress via callback
      act(() => {
        if (getCapturedCallback()) {
          getCapturedCallback()({ ...baseMockLoadedStatus(), isPlaying: true, positionMillis: 15000 });
        }
      });

      // Assert position display updates
      expect(screen.getByText("0:15 / 1:00")).toBeTruthy();

      // Simulate more progress via callback
      act(() => {
        if (getCapturedCallback()) {
          getCapturedCallback()({ ...baseMockLoadedStatus(), isPlaying: true, positionMillis: 30500 });
        }
      });

      // Assert position display updates (should round down)
      expect(screen.getByText("0:30 / 1:00")).toBeTruthy(); // Should round down
    });
  }); // End Audio Player describe block

});

// --- Test Setup ---
