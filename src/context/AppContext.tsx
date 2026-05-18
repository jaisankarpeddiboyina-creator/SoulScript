import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Quote, ViewMode, QuoteLength, QuoteCategory, QuoteSort } from '../types';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ExploreFilters {
  category: QuoteCategory | 'all';
  search: string;
  length: QuoteLength;
  sort: QuoteSort;
}

interface AppContextType {
  activeTab: 'explore' | 'generate' | 'playlists' | 'delivery' | 'collections';
  setActiveTab: (tab: 'explore' | 'generate' | 'playlists' | 'delivery' | 'collections') => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  
  // Toasts
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Persisted Explore State
  exploreFilters: ExploreFilters;
  setExploreFilters: React.Dispatch<React.SetStateAction<ExploreFilters>>;
  stagedFilters: ExploreFilters;
  setStagedFilters: React.Dispatch<React.SetStateAction<ExploreFilters>>;
  applyFilters: () => void;
  resetFilters: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isSelectMode: boolean;
  setIsSelectMode: (mode: boolean) => void;
  filteredCount: number;
  setFilteredCount: (count: number) => void;

  // Preloaded Quote for Generate
  generatePreloadedQuote: { content: string; author: string; category: QuoteCategory; imageUrl: string } | null;
  setGeneratePreloadedQuote: (quote: { content: string; author: string; category: QuoteCategory; imageUrl: string } | null) => void;

  // Cache
  quoteCache: React.MutableRefObject<Record<string, { quotes: Quote[]; pages: number }>>;
  imageCache: React.MutableRefObject<Record<string, string[]>>;
  
  // Playlist Modal
  playlistModalQuote: { id: string; quoteText: string; author: string; category: string; imageUrl: string } | null;
  setPlaylistModalQuote: (quote: { id: string; quoteText: string; author: string; category: string; imageUrl: string } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'explore' | 'generate' | 'playlists' | 'delivery' | 'collections'>('explore');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('soulscript-theme') as 'dark' | 'light') || 'dark';
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const [exploreFilters, setExploreFilters] = useState<ExploreFilters>({
    category: 'all',
    search: '',
    length: 'all',
    sort: 'random'
  });
  const [stagedFilters, setStagedFilters] = useState<ExploreFilters>(exploreFilters);
  const [viewMode, setViewMode] = useState<ViewMode>((localStorage.getItem('viewMode') as ViewMode) || 'grid');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);
  const [generatePreloadedQuote, setGeneratePreloadedQuote] = useState<{ content: string; author: string; category: QuoteCategory; imageUrl: string } | null>(null);
  const [playlistModalQuote, setPlaylistModalQuote] = useState<{ id: string; quoteText: string; author: string; category: string; imageUrl: string } | null>(null);

  const quoteCache = useRef<Record<string, { quotes: Quote[]; pages: number }>>({});
  const imageCache = useRef<Record<string, string[]>>({});

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('soulscript-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);

  const applyFilters = () => {
    setExploreFilters(stagedFilters);
  };

  const resetFilters = () => {
    const defaultFilters: ExploreFilters = { 
      category: 'all', 
      search: '', 
      length: 'all', 
      sort: 'random'
    };
    setExploreFilters(defaultFilters);
    setStagedFilters(defaultFilters);
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AppContext.Provider 
      value={{ 
        activeTab, 
        setActiveTab, 
        theme,
        toggleTheme,
        toasts,
        addToast,
        removeToast,
        exploreFilters,
        setExploreFilters,
        stagedFilters,
        setStagedFilters,
        applyFilters,
        resetFilters,
        viewMode,
        setViewMode,
        isSelectMode,
        setIsSelectMode,
        filteredCount,
        setFilteredCount,
        generatePreloadedQuote,
        setGeneratePreloadedQuote,
        quoteCache,
        imageCache,
        playlistModalQuote,
        setPlaylistModalQuote
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
