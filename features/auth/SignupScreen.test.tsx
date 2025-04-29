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

type SignupScreenProps = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

const mockNavigation = {
  navigate: jest.fn(),
} as unknown as SignupScreenProps['navigation'];

const mockRoute = {
  key: 'Signup',
  name: 'Signup',
} as SignupScreenProps['route'];

describe('SignupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the useAuth hook return value
    (useAuth as jest.Mock).mockReturnValue({
      signUp: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders correctly', async () => {
    await act(async () => {
      const { getByText } = render(
        <PaperProvider>
          <SignupScreen navigation={mockNavigation} route={mockRoute} />
        </PaperProvider>
      );
      
      expect(getByText('アカウント作成')).toBeTruthy();
    });
  });
});
