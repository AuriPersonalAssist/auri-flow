/**
 * Auri Store - Zustand State Management with IndexedDB Persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del, clear } from 'idb-keyval';
import type { Task, UserPreferences, ConflictSuggestion, WeeklyAnchor } from '../engine/types';
import { DEFAULTS } from '../engine/calibration';
import { recalculateAllPriorities, scoreTask } from '../engine/priority';

interface AuriState {
  // Data
  tasks: Task[];
  preferences: UserPreferences;
  suggestions: ConflictSuggestion[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastCalculation: string | null;
  onboardingComplete: boolean;
  
  // Actions - Tasks
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  recalculatePriorities: () => void;
  
  // Actions - Preferences
  updateWeights: (weights: { wd: number; wf: number; wm: number }) => void;
  updateAnchor: (anchor: WeeklyAnchor) => void;
  removeAnchor: (type: WeeklyAnchor['type']) => void;
  completeOnboarding: (weights: { wd: number; wf: number; wm: number }, anchors: WeeklyAnchor[]) => void;
  
  // Actions - Suggestions
  setSuggestions: (suggestions: ConflictSuggestion[]) => void;
  clearSuggestions: () => void;
  applySuggestion: (suggestionId: string) => void;
  
  // Actions - Data Management
  exportData: () => string;
  importData: (data: string) => boolean;
  clearAllData: () => void;
  
  // Actions - UI
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// IndexedDB storage configuration
const storage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const value = await get(name);
    return value || null;
  },
  setItem: async (name: string, value: string) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  }
}));

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const createDefaultPreferences = (): UserPreferences => ({
  weights: DEFAULTS.defaultWeights,
  anchors: [],
  timeFormat: '24h',
  language: 'pt',
  onboardingComplete: false,
  voiceEnabled: true,
  autoSuggestions: true,
  dataRetentionDays: 0
});

export const useAuriStore = create<AuriState>()(
  persist(
    (set, get) => ({
      // Initial state
      tasks: [],
      preferences: createDefaultPreferences(),
      suggestions: [],
      isLoading: false,
      error: null,
      lastCalculation: null,
      onboardingComplete: false,
      
      // Task actions
      addTask: (taskData) => {
        console.log('[Auri::Store] Adding task:', taskData.title);
        
        const now = new Date().toISOString();
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          completed: false,
          priorityScore: 0
        };
        
        set((state) => {
          const updatedTasks = [...state.tasks, newTask];
          const sortedTasks = recalculateAllPriorities(updatedTasks, state.preferences);
          
          return {
            tasks: sortedTasks,
            lastCalculation: now,
            error: null
          };
        });
      },
      
      updateTask: (id, updates) => {
        console.log('[Auri::Store] Updating task:', id);
        
        const now = new Date().toISOString();
        set((state) => {
          const updatedTasks = state.tasks.map(task =>
            task.id === id 
              ? { ...task, ...updates, updatedAt: now }
              : task
          );
          
          const sortedTasks = recalculateAllPriorities(updatedTasks, state.preferences);
          
          return {
            tasks: sortedTasks,
            lastCalculation: now,
            error: null
          };
        });
      },
      
      deleteTask: (id) => {
        console.log('[Auri::Store] Deleting task:', id);
        
        set((state) => ({
          tasks: state.tasks.filter(task => task.id !== id),
          lastCalculation: new Date().toISOString(),
          error: null
        }));
      },
      
      completeTask: (id) => {
        console.log('[Auri::Store] Completing task:', id);
        get().updateTask(id, { completed: true });
      },
      
      recalculatePriorities: () => {
        console.log('[Auri::Store] Recalculating priorities');
        
        set((state) => {
          const sortedTasks = recalculateAllPriorities(state.tasks, state.preferences);
          
          return {
            tasks: sortedTasks,
            lastCalculation: new Date().toISOString(),
            error: null
          };
        });
      },
      
      // Preference actions
      updateWeights: (weights) => {
        console.log('[Auri::Store] Updating weights:', weights);
        
        // Normalize weights to sum to 1
        const total = weights.wd + weights.wf + weights.wm;
        const normalized = {
          wd: weights.wd / total,
          wf: weights.wf / total,
          wm: weights.wm / total
        };
        
        set((state) => {
          const updatedPrefs = {
            ...state.preferences,
            weights: normalized
          };
          
          const sortedTasks = recalculateAllPriorities(state.tasks, updatedPrefs);
          
          return {
            preferences: updatedPrefs,
            tasks: sortedTasks,
            lastCalculation: new Date().toISOString()
          };
        });
      },
      
      updateAnchor: (anchor) => {
        console.log('[Auri::Store] Updating anchor:', anchor);
        
        set((state) => {
          const existingIndex = state.preferences.anchors.findIndex(a => a.type === anchor.type);
          let updatedAnchors;
          
          if (existingIndex >= 0) {
            updatedAnchors = [...state.preferences.anchors];
            updatedAnchors[existingIndex] = anchor;
          } else {
            updatedAnchors = [...state.preferences.anchors, anchor];
          }
          
          return {
            preferences: {
              ...state.preferences,
              anchors: updatedAnchors
            }
          };
        });
      },
      
      removeAnchor: (type) => {
        console.log('[Auri::Store] Removing anchor:', type);
        
        set((state) => ({
          preferences: {
            ...state.preferences,
            anchors: state.preferences.anchors.filter(a => a.type !== type)
          }
        }));
      },
      
      completeOnboarding: (weights, anchors) => {
        console.log('[Auri::Store] Completing onboarding');
        
        const total = weights.wd + weights.wf + weights.wm;
        const normalized = {
          wd: weights.wd / total,
          wf: weights.wf / total,
          wm: weights.wm / total
        };
        
        set((state) => ({
          preferences: {
            ...state.preferences,
            weights: normalized,
            anchors,
            onboardingComplete: true
          },
          onboardingComplete: true
        }));
      },
      
      // Suggestion actions
      setSuggestions: (suggestions) => {
        console.log('[Auri::Store] Setting suggestions:', suggestions.length);
        set({ suggestions });
      },
      
      clearSuggestions: () => {
        console.log('[Auri::Store] Clearing suggestions');
        set({ suggestions: [] });
      },
      
      applySuggestion: (suggestionId) => {
        console.log('[Auri::Store] Applying suggestion:', suggestionId);
        
        const suggestion = get().suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
          get().updateTask(suggestion.originalTask.id, suggestion.modifiedTask);
          get().clearSuggestions();
        }
      },
      
      // Data management actions
      exportData: () => {
        console.log('[Auri::Store] Exporting data');
        
        const state = get();
        const exportData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          tasks: state.tasks,
          preferences: state.preferences
        };
        
        return JSON.stringify(exportData, null, 2);
      },
      
      importData: (data) => {
        console.log('[Auri::Store] Importing data');
        
        try {
          const parsed = JSON.parse(data);
          
          if (!parsed.version || !parsed.tasks || !parsed.preferences) {
            throw new Error('Invalid data format');
          }
          
          set((state) => {
            const sortedTasks = recalculateAllPriorities(parsed.tasks, parsed.preferences);
            
            return {
              tasks: sortedTasks,
              preferences: parsed.preferences,
              lastCalculation: new Date().toISOString(),
              error: null,
              onboardingComplete: parsed.preferences.onboardingComplete
            };
          });
          
          return true;
        } catch (error) {
          console.error('[Auri::Store] Import error:', error);
          get().setError('Erro ao importar dados. Verifique o formato do arquivo.');
          return false;
        }
      },
      
      clearAllData: () => {
        console.log('[Auri::Store] Clearing all data');
        
        set({
          tasks: [],
          preferences: createDefaultPreferences(),
          suggestions: [],
          lastCalculation: null,
          error: null,
          onboardingComplete: false
        });
      },
      
      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error })
    }),
    {
      name: 'auri-storage',
      storage,
      partialize: (state) => ({
        tasks: state.tasks,
        preferences: state.preferences,
        onboardingComplete: state.onboardingComplete
      })
    }
  )
);