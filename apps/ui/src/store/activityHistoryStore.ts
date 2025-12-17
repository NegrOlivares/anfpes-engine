import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivityType = 'search' | 'similar' | 'comparison' | 'profile';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: number;
  playerId?: string;
  playerName?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

interface ActivityHistoryState {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  getRecentActivities: (limit?: number) => Activity[];
}

export const useActivityHistoryStore = create<ActivityHistoryState>()(
  persist(
    (set, get) => ({
      activities: [],

      addActivity: (activity) => {
        const newActivity: Activity = {
          ...activity,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          activities: [newActivity, ...state.activities].slice(0, 50), // Keep only last 50
        }));
      },

      clearActivities: () => set({ activities: [] }),

      getRecentActivities: (limit = 10) => {
        return get().activities.slice(0, limit);
      },
    }),
    {
      name: 'anfpes-activity-history',
      version: 1,
    },
  ),
);
