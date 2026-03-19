import { create } from 'zustand';

interface AnimationState {
  hasVisitedHome: boolean;
  setHasVisitedHome: (visited: boolean) => void;
}

export const useAnimationStore = create<AnimationState>((set) => ({
  hasVisitedHome: false,
  setHasVisitedHome: (visited) => set({ hasVisitedHome: visited }),
}));
