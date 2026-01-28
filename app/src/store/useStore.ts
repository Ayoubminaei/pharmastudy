import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Chapter, Topic, StudyItem } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  
  // Navigation
  currentView: 'login' | 'signup' | 'dashboard' | 'chapters' | 'topics' | 'items' | 'flashcards' | 'quiz' | 'account';
  setCurrentView: (view: AppState['currentView']) => void;
  
  // Selected items
  selectedChapter: Chapter | null;
  setSelectedChapter: (chapter: Chapter | null) => void;
  selectedTopic: Topic | null;
  setSelectedTopic: (topic: Topic | null) => void;
  selectedItem: StudyItem | null;
  setSelectedItem: (item: StudyItem | null) => void;
  
  // Data
  chapters: Chapter[];
  setChapters: (chapters: Chapter[]) => void;
  topics: Topic[];
  setTopics: (topics: Topic[]) => void;
  items: StudyItem[];
  setItems: (items: StudyItem[]) => void;
  
  // Flashcards
  flashcardMode: boolean;
  setFlashcardMode: (mode: boolean) => void;
  currentFlashcardIndex: number;
  setCurrentFlashcardIndex: (index: number) => void;
  flashcardItems: StudyItem[];
  setFlashcardItems: (items: StudyItem[]) => void;
  
  // UI
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),
      isAuthenticated: false,
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
      
      // Navigation
      currentView: 'login',
      setCurrentView: (view) => set({ currentView: view }),
      
      // Selected items
      selectedChapter: null,
      setSelectedChapter: (chapter) => set({ selectedChapter: chapter }),
      selectedTopic: null,
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      selectedItem: null,
      setSelectedItem: (item) => set({ selectedItem: item }),
      
      // Data
      chapters: [],
      setChapters: (chapters) => set({ chapters }),
      topics: [],
      setTopics: (topics) => set({ topics }),
      items: [],
      setItems: (items) => set({ items }),
      
      // Flashcards
      flashcardMode: false,
      setFlashcardMode: (mode) => set({ flashcardMode: mode }),
      currentFlashcardIndex: 0,
      setCurrentFlashcardIndex: (index) => set({ currentFlashcardIndex: index }),
      flashcardItems: [],
      setFlashcardItems: (items) => set({ flashcardItems: items }),
      
      // UI
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'pharmastudy-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedChapter: state.selectedChapter,
        selectedTopic: state.selectedTopic,
      }),
    }
  )
);
