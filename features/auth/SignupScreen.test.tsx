import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import SignupScreen from './SignupScreen';
import { useAuth } from '../../hooks/useAuth';
import { RecoilRoot } from 'recoil';
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
} as unknown as SignupScreenProps['route'];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot>
    <PaperProvider>
      {children}
    </PaperProvider>
  </RecoilRoot>
);
TestWrapper.displayName = 'TestWrapper';

describe('SignupScreen', () => {
  jest.useFakeTimers();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    // Mock the useAuth hook return value
    (useAuth as jest.Mock).mockReturnValue({
      signUp: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders correctly', async () => {
    render(
      <TestWrapper>
        <SignupScreen navigation={mockNavigation} route={mockRoute} />
      </TestWrapper>
    );
    
    expect(await screen.findByText('アカウント作成')).toBeTruthy();
  });
});
