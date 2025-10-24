import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
  }

  /**
   * Initiate Google OAuth login via Emergent Auth
   */
  async initiateGoogleLogin() {
    // Get the current app URL for redirect
    const redirectUrl = Linking.createURL('/');
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    
    // Open the auth URL
    await Linking.openURL(authUrl);
  }

  /**
   * Process session ID from URL fragment after OAuth redirect
   */
  async processSessionId(sessionId: string) {
    try {
      const response = await fetch(`${this.baseURL}/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Session processing failed:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          return null; // Not authenticated
        }
        throw new Error(`Failed to get user: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Important for cookies
      });

      return response.ok;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  /**
   * Extract session ID from URL fragment
   */
  extractSessionIdFromUrl(url: string): string | null {
    try {
      const parsed = Linking.parse(url);
      const fragment = parsed.path?.split('#')[1];
      
      if (fragment) {
        const params = new URLSearchParams(fragment);
        return params.get('session_id');
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting session ID:', error);
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;