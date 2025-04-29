// /media/thithilab/ボリューム1/ACR/ACR-app/jest.setup.ts
import '@testing-library/jest-native/extend-expect';
// react-native-gesture-handler のセットアップを追加
import 'react-native-gesture-handler/jestSetup';

jest.setTimeout(30000);

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      firebaseApiKey: 'mock-api-key',
      firebaseAuthDomain: 'mock-auth-domain',
      firebaseProjectId: 'mock-project-id',
      firebaseStorageBucket: 'mock-storage-bucket',
      firebaseMessagingSenderId: 'mock-messaging-sender-id',
      firebaseAppId: 'mock-app-id',
    },
    version: '1.0.0',
  },
}));

beforeAll(() => {
  jest.spyOn(global, 'setTimeout');
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.clearAllMocks();
  
  jest.spyOn(global, 'requestAnimationFrame').mockRestore();
  jest.spyOn(global, 'cancelAnimationFrame').mockRestore();
});

// react-native-svg のモックを追加
jest.mock('react-native-svg', () => {
  // Use require inside the factory
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockSvg = (props: any) => React.createElement('svg', props, props.children);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPath = (props: any) => React.createElement('path', props, props.children);
  // Add other SVG elements as needed
  return {
    __esModule: true, // Required for ES Modules
    default: mockSvg,
    Svg: mockSvg,
    Path: mockPath,
    // Circle: mockCircle, Rect: mockRect, etc.
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
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    useAnimatedStyle: jest.fn(() => ({} as Record<string, unknown>)),
    withTiming: jest.fn((toValue) => toValue),
    withSpring: jest.fn((toValue) => toValue),
    Easing: {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      bezier: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      linear: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      ease: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      quad: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      cubic: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      sin: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      circle: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      exp: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      in: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      out: jest.fn(() => ({} as Record<string, unknown>)),
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      inOut: jest.fn(() => ({} as Record<string, unknown>)),
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

jest.mock('react-native', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockComponent = (name: string): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = ({ children, ...props }: { children?: any; [key: string]: any }) => {
      return React.createElement(name, props, children);
    };
    component.displayName = name;
    return component;
  };
  
  return {
    ActivityIndicator: mockComponent('ActivityIndicator'),
    View: mockComponent('View'),
    Text: mockComponent('Text'),
    ScrollView: mockComponent('ScrollView'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    FlatList: mockComponent('FlatList'),
    TextInput: mockComponent('TextInput'),
    KeyboardAvoidingView: mockComponent('KeyboardAvoidingView'),
    Pressable: mockComponent('Pressable'),
    Image: mockComponent('Image'),
    StyleSheet: {
      create: (styles: Record<string, unknown>) => styles,
      flatten: (styles: unknown) => styles,
    },
    Platform: {
      OS: 'ios',
      select: (obj: Record<string, unknown>) => obj.ios || obj.default,
    },
    Dimensions: {
      get: jest.fn().mockReturnValue({ width: 375, height: 812 }),
    },
    Animated: {
      View: mockComponent('Animated.View'),
      Text: mockComponent('Animated.Text'),
      createAnimatedComponent: jest.fn((component) => component),
      timing: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
      })),
      spring: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback({ finished: true })),
      })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({
          interpolate: jest.fn(),
        })),
      })),
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
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    params: {} as Record<string, unknown>,
  })),
  useIsFocused: jest.fn(() => true),
}));

jest.mock('react-native-paper', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockComponent = (name: string): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = ({ children, ...props }: { children?: any; [key: string]: any }) => {
      return React.createElement(name, props, children);
    };
    component.displayName = name;
    return component;
  };
  
  const TextInput = mockComponent('TextInput');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (TextInput as any).Icon = mockComponent('TextInput.Icon');
  
  return {
    Button: mockComponent('Button'),
    TextInput,
    Text: mockComponent('Text'),
    HelperText: mockComponent('HelperText'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PaperProvider: ({ children }: { children: any }) => children,
    ActivityIndicator: mockComponent('ActivityIndicator'),
    List: {
      Item: mockComponent('List.Item'),
      Section: mockComponent('List.Section'),
    },
    Divider: mockComponent('Divider'),
    Switch: mockComponent('Switch'),
    MD3LightTheme: {},
  };
});

jest.mock('react-native-safe-area-context', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SafeAreaProvider: ({ children }: { children: any }) => children,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  SafeAreaView: ({ children }: { children: any }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn((callback) => callback({ setTag: jest.fn() })),
}));

global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};
