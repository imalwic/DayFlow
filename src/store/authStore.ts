import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday: string;
  gender: 'male' | 'female';
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  appLocked: boolean; // Indicates if the app is currently locked via biometrics
  isAppLockEnabled: boolean;
  setAppLocked: (locked: boolean) => void;
  setAppLockEnabled: (enabled: boolean) => void;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  appLocked: false,
  isAppLockEnabled: false,
  
  setAppLocked: (locked) => set({ appLocked: locked }),
  
  setAppLockEnabled: async (enabled) => {
    await SecureStore.setItemAsync('appLockEnabled', enabled ? 'true' : 'false');
    set({ isAppLockEnabled: enabled });
  },

  login: async (user) => {
    // Store user session locally
    await SecureStore.setItemAsync('userSession', JSON.stringify(user));
    set({ user, appLocked: false });
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('userSession');
    set({ user: null, appLocked: false });
  },
  
  checkAuth: async () => {
    try {
      const sessionStr = await SecureStore.getItemAsync('userSession');
      const lockStr = await SecureStore.getItemAsync('appLockEnabled');
      
      const isLockEnabled = lockStr === 'true';
      
      if (sessionStr) {
        const user = JSON.parse(sessionStr);
        set({ user, isAppLockEnabled: isLockEnabled, appLocked: isLockEnabled, isLoading: false });
      } else {
        set({ user: null, isAppLockEnabled: isLockEnabled, isLoading: false });
      }
    } catch (e) {
      set({ user: null, isLoading: false });
    }
  }
}));
