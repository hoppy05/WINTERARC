import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  winter_title: string;
  total_score: number;
  streak_days: number;
  longest_streak: number;
  created_at: string;
  last_active: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  category: string;
  target_value?: string;
  unit?: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  value: string;
  notes?: string;
  logged_at: string;
  ai_response?: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  is_user: boolean;
  timestamp: string;
}

interface UserState {
  user: User | null;
  habits: Habit[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  setUser: (user: User) => void;
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  removeHabit: (habitId: string) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      habits: [],
      chatMessages: [],
      isLoading: false,
      setUser: (user) => set({ user }),
      setHabits: (habits) => set({ habits }),
      addHabit: (habit) => set((state) => ({ habits: [...state.habits, habit] })),
      removeHabit: (habitId) => 
        set((state) => ({ 
          habits: state.habits.filter((h) => h.id !== habitId) 
        })),
      setChatMessages: (chatMessages) => set({ chatMessages }),
      addChatMessage: (message) => 
        set((state) => ({ 
          chatMessages: [...state.chatMessages, message] 
        })),
      setLoading: (isLoading) => set({ isLoading }),
      clearUser: () => set({ 
        user: null, 
        habits: [], 
        chatMessages: [] 
      }),
    }),
    {
      name: 'winter-arc-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
