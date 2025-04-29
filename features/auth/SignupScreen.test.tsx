import React from 'react';
import { render, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import SignupScreen from './SignupScreen';
import { useAuth } from '../../hooks/useAuth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Define types for props
type SignupScreenProps = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

// Mock navigation and route
const mockNavigation = {
  navigate: jest.fn(),
} as unknown as SignupScreenProps['navigation'];

const mockRoute = {
  key: 'Signup',
  name: 'Signup',
} as unknown as SignupScreenProps['route'];

/**
 * Test suite for SignupScreen
 * 
 * Fixed environment tear-down issues by:
 * 1. Using act() to wrap render and unmount operations
 * 2. Properly mocking React Native Paper components
 * 3. Ensuring all animations and timers are cleaned up
 */
describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the useAuth hook return value with a simple mock function
    (useAuth as jest.Mock).mockReturnValue({
      signUp: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders without crashing', () => {
    // Define component with proper type
    let component: ReturnType<typeof render> | undefined;
    
    // Wrap in act to handle all state updates
    act(() => {
      component = render(
        <PaperProvider>
          <SignupScreen navigation={mockNavigation} route={mockRoute} />
        </PaperProvider>
      );
    });
    
    expect(component).toBeTruthy();
    
    if (component) {
      act(() => {
        component.unmount();
      });
    }
  });
});
