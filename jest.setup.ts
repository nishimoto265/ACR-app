// /media/thithilab/ボリューム1/ACR/ACR-app/jest.setup.ts
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

jest.setTimeout(30000);

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

jest.mock('expo-constants', () => ({
  statusBarHeight: 20,
  manifest: {
    name: 'mock-app',
    slug: 'mock-app',
    version: '1.0.0',
  },
  // Add other properties if needed
}));

// Use requireActual for react-native but selectively mock problematic parts
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react'); // Require React inside the factory
  const MockedView = RN.View; // Get View from the actual RN inside the factory

  // Explicitly mock the Switch component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RN.Switch = (props: any) => {
    // Use mocked View with accessibility props for testing-library
    return React.createElement(MockedView, {
      ...props,
      role: 'switch',
      accessibilityState: { checked: props.value },
    });
  };
  RN.Switch.displayName = 'MockSwitch';

  // Mock Alert directly on RN object
  RN.Alert = {
    ...RN.Alert,
    alert: jest.fn(),
  };

  // Return the modified RN object
  return RN;
});

//---------------------------------------------
// Mock react-native-paper
//---------------------------------------------
jest.mock('react-native-paper', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native'); // Import View/Text for basic rendering in mocks
  // Get the real react-native-paper library
  const RealPaper = jest.requireActual('react-native-paper');

  // Helper to create simple mock components using View/Text
  const mockComponent = (name: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Mock = ({ children, ...props }: any) => {
      // Use View as a basic container
      return React.createElement(View, props, children);
    };
    Mock.displayName = name;
    return Mock;
  };

  // Specific mock for Button to render Text inside View
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockButton = ({ children, ...props }: { children?: React.ReactNode; [key: string]: any }) => {
    // Restore wrapping children in Text
    return React.createElement(View, { ...props }, React.createElement(Text, null, children));
  };
  MockButton.displayName = 'MockButton';

  // Detailed mock for ListItem
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockListItem = ({ title, right, ...props }: { title?: string | React.ReactNode; right?: (props: any) => React.ReactNode | React.ReactNode; [key: string]: any }) => {
    const titleElement = typeof title === 'string' ? React.createElement(Text, null, title) : title;
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const rightElement = typeof right === 'function' ? right({} as any) : right;
    return React.createElement(View, props, titleElement, rightElement);
  };
  MockListItem.displayName = 'MockList.Item';

  // Mock Card and its sub-components
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockCardComponent = ({ children, ...props }: any) => {
    return React.createElement(View, { ...props }, children);
  };
  MockCardComponent.displayName = 'MockCard';
  const MockCardContent = mockComponent('MockCard.Content');
  const MockCardActions = mockComponent('MockCard.Actions');
  const MockCard = Object.assign(MockCardComponent, {
    Content: MockCardContent,
    Actions: MockCardActions,
  });

  // Mock List Subheader
  const MockListSubheader = ({ children, ...props }: { children?: React.ReactNode }) => {
    return React.createElement(View, props, React.createElement(Text, null, children));
  };
  MockListSubheader.displayName = 'MockList.Subheader';

  // Mock TextInput
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockTextInputComponent = ({ value: initialValue, onChangeText, label, ...props }: any) => {
    // Use state to simulate the text input value
    const [currentValue, setCurrentValue] = React.useState(initialValue || '');

    const handleChangeText = (text: string) => {
      setCurrentValue(text);
      if (onChangeText) {
        onChangeText(text);
      }
    };

    // Render a basic View that includes the label and passes the current value
    // We pass the *state* `currentValue` as the `value` prop so tests can assert on it.
    return React.createElement(View, {
      ...props,
      value: currentValue, // Pass the state value
      onChangeText: handleChangeText, // Use our state-updating handler
     }, label ? React.createElement(Text, null, label) : null);
  };
  MockTextInputComponent.displayName = 'MockTextInput';
  const MockTextInputIcon = mockComponent('MockTextInput.Icon');
  const MockTextInput = Object.assign(MockTextInputComponent, {
    Icon: MockTextInputIcon,
  });

  // Mock ActivityIndicator
  const MockActivityIndicator = mockComponent('MockActivityIndicator');

  // Mock PaperProvider
  const MockPaperProvider = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(React.Fragment, null, children);
  };
  MockPaperProvider.displayName = 'MockPaperProvider';

  // Mock useTheme hook
  const mockUseTheme = () => ({
    dark: false,
    colors: {
      primary: 'purple',
      background: 'white',
      card: 'white',
      text: 'black',
      border: 'grey',
      notification: 'red',
      // Add other colors from the default theme if needed by components
      ...RealPaper.DefaultTheme.colors, // Include real defaults too
    },
    fonts: RealPaper.DefaultTheme.fonts,
    roundness: RealPaper.DefaultTheme.roundness,
    // Add other theme properties if needed
  });

  // Return the real library spread with our overrides
  return {
    ...RealPaper,
    // --- Overrides ---
    PaperProvider: MockPaperProvider,
    ActivityIndicator: MockActivityIndicator,
    Button: MockButton,
    Card: MockCard,
    TextInput: MockTextInput,
    List: {
      ...RealPaper.List, // Keep real List subcomponents not explicitly mocked
      Item: MockListItem,
      Subheader: MockListSubheader,
      Icon: mockComponent('MockList.Icon'), // Ensure mocks for used subcomponents
      Accordion: mockComponent('MockList.Accordion'),
    },
    useTheme: mockUseTheme,
    // Add other component/hook mocks here if they cause issues
  };
});

//---------------------------------------------
// Mock Navigation
//---------------------------------------------
jest.mock('./navigation/RootNavigator', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const React = require('react');
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const MockRootNavigator = ({ children }: { children: React.ReactNode }) => {
    // Render a simple View with the testID that App.test.tsx is looking for
    return React.createElement(View, { testID: 'mock-root-navigator' }, children);
  };
  MockRootNavigator.displayName = 'MockRootNavigator'; 
  return {
    __esModule: true, // Needed for ES Modules
    default: MockRootNavigator,
  };
});

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true]), // Assume fonts are loaded immediately
}));

jest.mock('react-native-device-info', () => ({
  useDeviceContext: jest.fn(() => ({})), // Return empty object for the context
  // Add mocks for other functions if needed by the app
}));

// Mock Firebase services to prevent actual initialization during tests
jest.mock('./services/firebase', () => ({ 
  // Export 'auth' directly as an object
  auth: {
    currentUser: null, // Default mock state
    signOut: jest.fn(() => Promise.resolve()), 
    signInAnonymously: jest.fn(() => Promise.resolve({ user: { uid: 'mock-anon-uid' } })), 
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-email-uid' } })), 
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'mock-new-uid' } })), 
    // Correct mock for onAuthStateChanged (takes callback directly in V9 SDK style)
    onAuthStateChanged: jest.fn((callback) => { 
      // Simulate initial state (no user)
      callback(null); 
      // Return mock unsubscribe
      return jest.fn(); 
    }),
    // Add other auth methods if needed
  },
  // Add other Firebase services mocks if needed (e.g., firestore)
}));

// Mock global requestAnimationFrame if needed, especially for libraries like Reanimated
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};
