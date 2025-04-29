import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, AuthContext } from './AuthProvider';
import * as firebaseAuth from 'firebase/auth';

jest.mock('firebase/auth', () => {
  const originalModule = jest.requireActual('firebase/auth');
  return {
    ...originalModule,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    signInAnonymously: jest.fn(),
    onAuthStateChanged: jest.fn(),
  };
});

jest.mock('../../services/firebase', () => ({
  auth: {},
}));

describe('AuthProvider', () => {
  const mockUser = { uid: 'test-uid', email: 'test@example.com' };
  let authStateCallback: (user: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    
    (firebaseAuth.onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      authStateCallback = callback;
      return jest.fn(); // Return unsubscribe function
    });
  });

  it('provides initial loading state', () => {
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    expect(contextValue.isLoading).toBe(true);
    expect(contextValue.user).toBe(null);
    expect(contextValue.error).toBe(null);
  });

  it('updates user state when auth state changes', async () => {
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    act(() => {
      authStateCallback(mockUser);
    });
    
    await waitFor(() => {
      expect(contextValue.isLoading).toBe(false);
      expect(contextValue.user).toBe(mockUser);
    });
  });

  it('calls signInWithEmailAndPassword when signIn is called', async () => {
    (firebaseAuth.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    await act(async () => {
      await contextValue.signIn('test@example.com', 'password123');
    });
    
    expect(firebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
  });

  it('calls createUserWithEmailAndPassword when signUp is called', async () => {
    (firebaseAuth.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({});
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    await act(async () => {
      await contextValue.signUp('test@example.com', 'password123');
    });
    
    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'test@example.com',
      'password123'
    );
  });

  it('calls signOut when signOut is called', async () => {
    (firebaseAuth.signOut as jest.Mock).mockResolvedValue({});
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    await act(async () => {
      await contextValue.signOut();
    });
    
    expect(firebaseAuth.signOut).toHaveBeenCalled();
  });

  it('calls signInAnonymously when signInAnonymously is called', async () => {
    (firebaseAuth.signInAnonymously as jest.Mock).mockResolvedValue({});
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    await act(async () => {
      await contextValue.signInAnonymously();
    });
    
    expect(firebaseAuth.signInAnonymously).toHaveBeenCalled();
  });

  it('sets error state when signIn fails', async () => {
    (firebaseAuth.signInWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Auth error'));
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    await act(async () => {
      try {
        await contextValue.signIn('test@example.com', 'password123');
      } catch (error) {
      }
    });
    
    expect(contextValue.error).toBe('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
  });

  it('sets error state when signUp fails', async () => {
    (firebaseAuth.createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(new Error('Auth error'));
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    await act(async () => {
      try {
        await contextValue.signUp('test@example.com', 'password123');
      } catch (error) {
      }
    });
    
    expect(contextValue.error).toBe('アカウント作成に失敗しました。別のメールアドレスを試してください。');
  });

  it('sets error state when signOut fails', async () => {
    (firebaseAuth.signOut as jest.Mock).mockRejectedValue(new Error('Auth error'));
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    await act(async () => {
      try {
        await contextValue.signOut();
      } catch (error) {
      }
    });
    
    expect(contextValue.error).toBe('ログアウトに失敗しました。');
  });

  it('sets error state when signInAnonymously fails', async () => {
    (firebaseAuth.signInAnonymously as jest.Mock).mockRejectedValue(new Error('Auth error'));
    
    let contextValue;
    
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    
    await act(async () => {
      try {
        await contextValue.signInAnonymously();
      } catch (error) {
      }
    });
    
    expect(contextValue.error).toBe('匿名ログインに失敗しました。');
  });
});
