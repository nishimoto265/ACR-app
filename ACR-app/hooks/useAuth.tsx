// /home/thithilab/ACR_Project/ACR-app/hooks/useAuth.ts

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut, // Rename to avoid conflict with local function
  createUserWithEmailAndPassword, // Import signUp function
} from 'firebase/auth';
import { auth } from '../services/firebase'; // Adjust path if firebase config is elsewhere

// Define types for auth functions
type SignInFunction = (email: string, password: string) => Promise<void>;
type SignInAnonymouslyFunction = () => Promise<void>;
type SignOutFunction = () => Promise<void>;
type SignUpFunction = (email: string, password: string) => Promise<void>; // Define signUp type

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  // Add function types to the context interface
  signIn: SignInFunction;
  signInAnonymously: SignInAnonymouslyFunction;
  signOut: SignOutFunction;
  signUp: SignUpFunction; // Add signUp to interface
}

// Create the context with initial dummy functions
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => { throw new Error('signIn function not ready'); },
  signInAnonymously: async () => { throw new Error('signInAnonymously function not ready'); },
  signOut: async () => { throw new Error('signOut function not ready'); },
  signUp: async () => { throw new Error('signUp function not ready'); }, // Add dummy signUp
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      console.log('Auth State Changed:', currentUser?.uid);
    });
    return () => unsubscribe();
  }, []);

  // Implement sign-in with email and password
  const signIn: SignInFunction = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Error signing in with email/password:", error);
      // Rethrow or handle error as needed (e.g., show message to user)
      throw error;
    }
  };

  // Implement anonymous sign-in
  const signInAnonymously: SignInAnonymouslyFunction = async () => {
    try {
      // Correctly call the imported Firebase function
      await firebaseSignInAnonymously(auth);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Error signing in anonymously:", error);
      throw error;
    }
  };

  // Implement sign-up with email and password
  const signUp: SignUpFunction = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  // Implement sign-out
  const signOut: SignOutFunction = async () => {
    try {
      await firebaseSignOut(auth);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  // Prepare the value to provide via context
  const value = {
    user,
    isLoading,
    signIn,
    signInAnonymously,
    signOut,
    signUp, // Provide signUp function
  };

  return (
    // Provide the implemented functions along with state
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};