import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  winter_title?: string;
  total_score?: number;
  streak_days?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
    setupDeepLinkListener();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      // Check if user is already authenticated
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupDeepLinkListener = () => {
    // Handle deep links when app is already running
    const handleDeepLink = (url: string) => {
      handleAuthCallback(url);
    };

    // Listen for incoming deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return subscription;
  };

  const handleAuthCallback = async (url: string) => {
    try {
      const sessionId = authService.extractSessionIdFromUrl(url);
      
      if (sessionId) {
        setIsLoading(true);
        
        // Process the session ID
        const userData = await authService.processSessionId(sessionId);
        
        if (userData) {
          setUser(userData);
          
          // Clean the URL by replacing it (removes session_id from URL)
          const cleanUrl = url.split('#')[0];
          Linking.openURL(cleanUrl);
        }
      }
    } catch (error) {
      console.error('Auth callback failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      await authService.initiateGoogleLogin();
      // The actual login completion will be handled by the deep link callback
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      
      // Clear any cached data
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('User refresh failed:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};