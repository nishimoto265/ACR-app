import { AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';

// Constants
export const MOCK_DURATION_MILLIS = 10000; // 10 seconds

// Define the initial status object conforming to AVPlaybackStatusSuccess
export const mockInitialSuccessStatus: AVPlaybackStatusSuccess = {
  isLoaded: true,
  uri: 'file:///test/recording.mp3',
  progressUpdateIntervalMillis: 100,
  durationMillis: MOCK_DURATION_MILLIS,
  positionMillis: 0,
  playableDurationMillis: MOCK_DURATION_MILLIS,
  seekMillisToleranceBefore: 0,
  seekMillisToleranceAfter: 0,
  shouldPlay: false,
  isPlaying: false,
  isBuffering: false,
  rate: 1.0,
  shouldCorrectPitch: false,
  volume: 1.0,
  isMuted: false,
  isLooping: false,
  didJustFinish: false,
  audioPan: 0,
};

// --- Mock Sound Class ---
export class MockSound {
  private status: AVPlaybackStatusSuccess;
  private playbackCallback: ((status: AVPlaybackStatus) => void) | null = null;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(initialStatus: AVPlaybackStatusSuccess) {
    this.status = { ...initialStatus };
  }

  private updateStatus(newStatus: Partial<AVPlaybackStatusSuccess>) {
    this.status = { ...this.status, ...newStatus, isLoaded: true };
    if (this.playbackCallback) {
      this.playbackCallback(this.status);
    }
  }

  async getStatusAsync(): Promise<AVPlaybackStatusSuccess> {
    return this.status;
  }

  setOnPlaybackStatusUpdate(callback: ((status: AVPlaybackStatus) => void) | null): void {
    this.playbackCallback = callback;
    // Immediately call back with the current status upon setting the listener
    if (this.playbackCallback) {
      this.playbackCallback(this.status);
    }
  }

  async playAsync(): Promise<AVPlaybackStatus> {
    if (this.status.isLoaded && !this.status.isPlaying) {
      this.updateStatus({ isPlaying: true, shouldPlay: true, didJustFinish: false });

      // Simulate playback progress
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        if (this.status.isPlaying && this.status.durationMillis) {
          const newPosition = this.status.positionMillis + (this.status.progressUpdateIntervalMillis ?? 100);
          if (newPosition >= this.status.durationMillis) {
            this.updateStatus({ positionMillis: this.status.durationMillis, isPlaying: false, didJustFinish: true });
            if (this.intervalId) clearInterval(this.intervalId);
            this.intervalId = null;
          } else {
            this.updateStatus({ positionMillis: newPosition });
          }
        } else {
          if (this.intervalId) clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }, this.status.progressUpdateIntervalMillis ?? 100);

    }
    return this.getStatusAsync();
  }

  async pauseAsync(): Promise<AVPlaybackStatus> {
    if (this.status.isLoaded && this.status.isPlaying) {
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = null;
      this.updateStatus({ isPlaying: false, shouldPlay: false });
    }
    return this.getStatusAsync();
  }

  async stopAsync(): Promise<AVPlaybackStatus> {
    if (this.status.isLoaded) {
      if (this.intervalId) clearInterval(this.intervalId);
      this.intervalId = null;
      this.updateStatus({ isPlaying: false, positionMillis: 0, shouldPlay: false, didJustFinish: false });
    }
    return this.getStatusAsync();
  }

  async setPositionAsync(positionMillis: number): Promise<AVPlaybackStatus> {
    if (this.status.isLoaded && this.status.durationMillis) {
      const newPosition = Math.max(0, Math.min(positionMillis, this.status.durationMillis));
      this.updateStatus({ positionMillis: newPosition, didJustFinish: newPosition === this.status.durationMillis });
    }
    return this.getStatusAsync();
  }

  async unloadAsync(): Promise<AVPlaybackStatus> {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = null;
    this.playbackCallback = null;
    const unloadedStatus: AVPlaybackStatus = { isLoaded: false };
    return unloadedStatus;
  }

  async setRateAsync(): Promise<AVPlaybackStatus> {
    return this.getStatusAsync();
  }

  async setVolumeAsync(): Promise<AVPlaybackStatus> {
    return this.getStatusAsync();
  }

  async setIsMutedAsync(): Promise<AVPlaybackStatus> {
    return this.getStatusAsync();
  }

  async setIsLoopingAsync(): Promise<AVPlaybackStatus> {
    return this.getStatusAsync();
  }

  async setProgressUpdateIntervalAsync(intervalMillis: number): Promise<AVPlaybackStatus> {
    if (this.status.isLoaded) {
      this.updateStatus({ progressUpdateIntervalMillis: intervalMillis });
    }
    return this.getStatusAsync();
  }
}

// --- Mock Audio Object ---
export const Audio = {
  Sound: {
    createAsync: jest.fn().mockImplementation(async (source, initialStatusUpdate) => {
      const initialMockStatus = {
        ...mockInitialSuccessStatus,
        uri: typeof source === 'object' && 'uri' in source ? source.uri : 'mock_uri',
        shouldPlay: initialStatusUpdate?.shouldPlay ?? false,
        progressUpdateIntervalMillis: initialStatusUpdate?.progressUpdateIntervalMillis ?? mockInitialSuccessStatus.progressUpdateIntervalMillis,
        positionMillis: initialStatusUpdate?.positionMillis ?? 0,
      };
      const soundInstance = new MockSound(initialMockStatus);

      const mockedSoundInstance = {
        getStatusAsync: jest.fn(soundInstance.getStatusAsync.bind(soundInstance)),
        setOnPlaybackStatusUpdate: jest.fn(soundInstance.setOnPlaybackStatusUpdate.bind(soundInstance)),
        playAsync: jest.fn(soundInstance.playAsync.bind(soundInstance)),
        pauseAsync: jest.fn(soundInstance.pauseAsync.bind(soundInstance)),
        stopAsync: jest.fn(soundInstance.stopAsync.bind(soundInstance)),
        setPositionAsync: jest.fn(soundInstance.setPositionAsync.bind(soundInstance)),
        unloadAsync: jest.fn(soundInstance.unloadAsync.bind(soundInstance)),
        setRateAsync: jest.fn(soundInstance.setRateAsync.bind(soundInstance)),
        setVolumeAsync: jest.fn(soundInstance.setVolumeAsync.bind(soundInstance)),
        setIsMutedAsync: jest.fn(soundInstance.setIsMutedAsync.bind(soundInstance)),
        setIsLoopingAsync: jest.fn(soundInstance.setIsLoopingAsync.bind(soundInstance)),
        setProgressUpdateIntervalAsync: jest.fn(soundInstance.setProgressUpdateIntervalAsync.bind(soundInstance)),
      };

      return { sound: mockedSoundInstance, status: await soundInstance.getStatusAsync() };
    }),
  },
  Recording: {
    // Mock Recording methods if needed for other tests
  },
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  // Add other Audio static methods if needed
};