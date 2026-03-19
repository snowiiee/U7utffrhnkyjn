import { create } from 'zustand';

interface AnimationState {
  hasVisitedHome: boolean;
  setHasVisitedHome: (visited: boolean) => void;
}

export const useAnimationStore = create<AnimationState>((set) => ({
  hasVisitedHome: false,
  setHasVisitedHome: (visited) => set({ hasVisitedHome: visited }),
}));

// Auth Store
interface AuthState {
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  setToken: (token: string | null) => void;
  initializeAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isLoading: true,
  isInitialized: false,
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('anilist_token', token);
    } else {
      localStorage.removeItem('anilist_token');
    }
    set({ token, isLoading: false });
  },
  
  initializeAuth: () => {
    if (get().isInitialized) return;
    
    const storedToken = typeof window !== 'undefined' 
      ? localStorage.getItem('anilist_token') 
      : null;
    
    set({ 
      token: storedToken, 
      isLoading: false,
      isInitialized: true 
    });
  },
  
  logout: () => {
    localStorage.removeItem('anilist_token');
    set({ token: null, isLoading: false });
  },
}));

// Convenience hook that auto-initializes auth
export const useAuth = () => {
  const store = useAuthStore();
  
  if (typeof window !== 'undefined' && !store.isInitialized) {
    store.initializeAuth();
  }
  
  return {
    token: store.token,
    isLoading: store.isLoading,
    isAuthenticated: !!store.token,
    setToken: store.setToken,
    logout: store.logout,
  };
};
