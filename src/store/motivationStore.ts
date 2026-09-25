import { create } from 'zustand';
import { getSetting, setSetting } from '@/db/database';

const QUOTES = [
  "Small steps, done today, beat perfect plans done never.",
  "Focus on being productive instead of busy.",
  "Your future is created by what you do today, not tomorrow.",
  "The secret of getting ahead is getting started.",
  "Don't count the days, make the days count."
];

type MotivationState = {
  streak: number;
  lastCompletedDate: string | null;
  dailyQuote: string;
  loadStreak: () => void;
  incrementStreak: () => void;
  resetStreak: () => void;
};

export const useMotivationStore = create<MotivationState>((set, get) => ({
  streak: 0, 
  lastCompletedDate: null,
  dailyQuote: QUOTES[new Date().getDate() % QUOTES.length],
  
  loadStreak: () => {
    const savedStreak = parseInt(getSetting('streak', '0'), 10);
    const lastDate = getSetting('lastCompletedDate', '');
    
    // Check if streak was broken (last completed was before yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = savedStreak;
    if (lastDate) {
      const last = new Date(lastDate);
      last.setHours(0, 0, 0, 0);
      const diffTime = Math.abs(today.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays > 1) {
        currentStreak = 0; // broken
        setSetting('streak', '0');
      }
    }
    
    set({ streak: currentStreak, lastCompletedDate: lastDate || null });
  },

  incrementStreak: () => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    
    if (state.lastCompletedDate === today) {
      return; // Already incremented today
    }
    
    const newStreak = state.streak + 1;
    setSetting('streak', newStreak.toString());
    setSetting('lastCompletedDate', today);
    
    set({
      streak: newStreak,
      lastCompletedDate: today,
    });
  },

  resetStreak: () => {
    setSetting('streak', '0');
    setSetting('lastCompletedDate', '');
    set({ streak: 0, lastCompletedDate: null });
  },
}));
