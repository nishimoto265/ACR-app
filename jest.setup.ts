// /media/thithilab/ボリューム1/ACR/ACR-app/jest.setup.ts
import '@testing-library/jest-native/extend-expect';
// react-native-gesture-handler のセットアップを追加
import 'react-native-gesture-handler/jestSetup';

jest.setTimeout(30000);

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllTimers();
});

// react-native-svg のモックを追加
jest.mock('react-native-svg', () => {
  // Use require inside the factory
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // Provide basic types for mocked components
  interface SvgProps extends React.PropsWithChildren<{}> {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    d?: string;
  }
  const MockSvg = (props: SvgProps) => React.createElement('svg', props, props.children);
  const MockPath = (props: SvgProps) => React.createElement('path', props, props.children);
  // Add other SVG elements as needed
  return {
    __esModule: true, // Required for ES Modules
    default: MockSvg,
    Svg: MockSvg,
    Path: MockPath,
    // Circle: MockCircle, Rect: MockRect, etc.
  };
});

jest.mock('expo-av', () => {
  const mockSound = {
    unloadAsync: jest.fn().mockResolvedValue(undefined),
    playAsync: jest.fn().mockResolvedValue(undefined),
    pauseAsync: jest.fn().mockResolvedValue(undefined),
    setPositionAsync: jest.fn().mockResolvedValue(undefined),
    getStatusAsync: jest.fn().mockResolvedValue({
      isLoaded: true,
      durationMillis: 60000,
      positionMillis: 0,
      isPlaying: false,
    }),
  };

  return {
    Audio: {
      Sound: {
        createAsync: jest.fn().mockImplementation((source, options, callback) => {
          // Immediately invoke the callback if provided
          if (callback && typeof callback === 'function') {
            const status = {
              isLoaded: true,
              durationMillis: 60000,
              positionMillis: 0,
              isPlaying: false,
            };
            setTimeout(() => callback(status), 0);
          }
          
          return Promise.resolve({
            sound: mockSound,
            status: {
              isLoaded: true,
              durationMillis: 60000,
              positionMillis: 0,
              isPlaying: false,
            },
          });
        }),
      },
    },
    AVPlaybackStatus: {
      isLoaded: true,
      durationMillis: 60000,
      positionMillis: 0,
      isPlaying: false,
    },
  };
});

// react-native-reanimated のモックを追加（シンプル化）
jest.mock('react-native-reanimated', () => {
  return {
    useSharedValue: jest.fn((initialValue) => ({ value: initialValue })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((toValue) => toValue),
    withSpring: jest.fn((toValue) => toValue),
    Easing: {
      bezier: jest.fn(() => ({})),
      linear: jest.fn(() => ({})),
      ease: jest.fn(() => ({})),
      quad: jest.fn(() => ({})),
      cubic: jest.fn(() => ({})),
      sin: jest.fn(() => ({})),
      circle: jest.fn(() => ({})),
      exp: jest.fn(() => ({})),
      in: jest.fn(() => ({})),
      out: jest.fn(() => ({})),
      inOut: jest.fn(() => ({})),
    },
    interpolate: jest.fn(() => 0),
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    runOnJS: jest.fn((fn) => fn),
    measure: jest.fn(() => ({
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      pageX: 0,
      pageY: 0,
    })),
    default: {
      createAnimatedComponent: jest.fn((component) => component),
    },
  };
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
  useIsFocused: jest.fn(() => true),
}));

global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};
