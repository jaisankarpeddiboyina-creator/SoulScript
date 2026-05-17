import { QuoteCategory } from '../types';

export interface PlaylistQuote {
  id: string;
  quoteText: string;
  author: string;
  category: string | QuoteCategory;
  imageUrl: string;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  quotes: PlaylistQuote[];
}

const STORAGE_KEY = 'soulscript_playlists';

export const getPlaylists = (): Playlist[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const createPlaylist = (name: string): Playlist => {
  const playlists = getPlaylists();
  const newPlaylist: Playlist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: Date.now(),
    quotes: []
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...playlists, newPlaylist]));
  return newPlaylist;
};

export const deletePlaylist = (id: string): void => {
  const playlists = getPlaylists();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists.filter(p => p.id !== id)));
};

export const addQuoteToPlaylist = (playlistId: string, quote: Omit<PlaylistQuote, 'addedAt'>): void => {
  const playlists = getPlaylists();
  const updatedPlaylists = playlists.map(p => {
    if (p.id === playlistId) {
      // Avoid duplicates
      if (p.quotes.find(q => q.id === quote.id)) return p;
      return {
        ...p,
        quotes: [...p.quotes, { ...quote, addedAt: Date.now() }]
      };
    }
    return p;
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlaylists));
};

export const removeQuoteFromPlaylist = (playlistId: string, quoteId: string): void => {
  const playlists = getPlaylists();
  const updatedPlaylists = playlists.map(p => {
    if (p.id === playlistId) {
      return {
        ...p,
        quotes: p.quotes.filter(q => q.id !== quoteId)
      };
    }
    return p;
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlaylists));
};
