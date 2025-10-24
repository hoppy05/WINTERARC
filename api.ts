import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User API
  async createUser(userData: { email: string; name: string; picture?: string }) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(userId: string) {
    return this.request(`/users/${userId}`);
  }

  async updateUserScore(userId: string) {
    return this.request(`/users/${userId}/score`, {
      method: 'PUT',
    });
  }

  // Habits API
  async createHabit(userId: string, habitData: { name: string; category: string; target_value?: string; unit?: string }) {
    return this.request(`/users/${userId}/habits`, {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  }

  async getUserHabits(userId: string) {
    return this.request(`/users/${userId}/habits`);
  }

  async deleteHabit(habitId: string) {
    return this.request(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  }

  // Habit Logs API
  async logHabit(userId: string, logData: { habit_id: string; value: string; notes?: string }) {
    return this.request(`/users/${userId}/habit-logs`, {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  async getHabitLogs(userId: string, limit = 50) {
    return this.request(`/users/${userId}/habit-logs?limit=${limit}`);
  }

  // Chat API
  async sendChatMessage(userId: string, message: string) {
    return this.request(`/users/${userId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getChatHistory(userId: string, limit = 50) {
    return this.request(`/users/${userId}/chat?limit=${limit}`);
  }

  // Leaderboard API
  async getLeaderboard(limit = 100) {
    return this.request(`/leaderboard?limit=${limit}`);
  }
}

export const apiService = new ApiService();
export default apiService;
