// /media/thithilab/ボリューム1/ACR/ACR-app/jest.setup.ts
import '@testing-library/jest-native/extend-expect';
// react-native-gesture-handler のセットアップを追加
import 'react-native-gesture-handler/jestSetup';

// react-native-svg のモックを追加
jest.mock('react-native-svg', () => {
  // Use require inside the factory
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  // Provide basic types for mocked components
  const MockSvg = (props: React.SVGProps<SVGSVGElement>) => React.createElement('svg', props, props.children);
  const MockPath = (props: React.SVGProps<SVGPathElement>) => React.createElement('path', props, props.children);
  // Add other SVG elements as needed
  return {
    __esModule: true, // Required for ES Modules
    default: MockSvg,
    Svg: MockSvg,
    Path: MockPath,
    // Circle: MockCircle, Rect: MockRect, etc.
  };
});

// react-native-reanimated のモックを追加
jest.mock('react-native-reanimated', () => {
  // Use requireActual for the real implementation
  const Reanimated = jest.requireActual('react-native-reanimated');
  return {
    ...Reanimated,
    // Mock specific functions, using 'unknown' instead of 'any'
    useSharedValue: jest.fn((initialValue: unknown) => ({ value: initialValue })),
    useAnimatedStyle: jest.fn((styleFactory: () => unknown) => styleFactory()),
    withTiming: jest.fn((toValue: unknown, _, cb) => { if (cb) { cb(true); } return toValue; }), // Call callback if provided
    withSpring: jest.fn((toValue: unknown, _, cb) => { if (cb) { cb(true); } return toValue; }), // Call callback if provided
    Easing: {
        // Mock easing functions if used
        bezier: jest.fn(() => ({ /* mock implementation */ })),
        linear: jest.fn(), // Add linear if needed
        // ... other easing functions
    },
    interpolate: jest.fn((value, inputRange, outputRange) => {
       // Simple linear interpolation mock for testing
       if (inputRange.length === 2 && outputRange.length === 2) {
         const [inMin, inMax] = inputRange;
         const [outMin, outMax] = outputRange;
         const progress = (value - inMin) / (inMax - inMin);
         return outMin + progress * (outMax - outMin);
       }
       return outputRange[0]; // Default fallback
    }),
    Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
    // Add other necessary mocks like runOnJS etc.
    runOnJS: jest.fn((fn) => fn),
  };
});

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
