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

export interface Subscription {
  id: string;
  channel: 'email' | 'telegram';
  email?: string;
  chatId?: string;
  username?: string;
  category: string;
  mood: string;
  count: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  timezone: string;
  paused: boolean;
  verified: boolean;
  createdAt: number;
}

export interface VerificationData {
  code: string;
  identifier: string; // email or username
  expiresAt: number;
  attempts: number;
}

const STORAGE_KEY = 'soulscript_playlists';
const SUBSCRIPTION_KEY = 'soulscript_subscription';
const VERIFICATION_KEY = 'soulscript_verification';

export const getVerification = (): VerificationData | null => {
  const data = localStorage.getItem(VERIFICATION_KEY);
  if (!data) return null;
  const parsed = JSON.parse(data);
  if (Date.now() > parsed.expiresAt) {
    localStorage.removeItem(VERIFICATION_KEY);
    return null;
  }
  return parsed;
};

export const saveVerification = (identifier: string, code: string): void => {
  const data: VerificationData = {
    code,
    identifier,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    attempts: 0
  };
  localStorage.setItem(VERIFICATION_KEY, JSON.stringify(data));
};

export const incrementVerificationAttempts = (): number => {
  const current = getVerification();
  if (!current) return 0;
  current.attempts += 1;
  localStorage.setItem(VERIFICATION_KEY, JSON.stringify(current));
  return current.attempts;
};

export const clearVerification = (): void => {
  localStorage.removeItem(VERIFICATION_KEY);
};

export const getSubscription = (): Subscription | null => {
  const data = localStorage.getItem(SUBSCRIPTION_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveSubscription = (data: Omit<Subscription, 'id' | 'createdAt' | 'paused' | 'verified'>): Subscription => {
  const newSubscription: Subscription = {
    ...data,
    id: `sub_${Date.now()}`,
    createdAt: Date.now(),
    paused: false,
    verified: false
  };
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(newSubscription));
  return newSubscription;
};

export const updateSubscription = (data: Partial<Subscription>): Subscription | null => {
  const current = getSubscription();
  if (!current) return null;
  const updated = { ...current, ...data };
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(updated));
  return updated;
};

export const pauseSubscription = (): void => {
  const current = getSubscription();
  if (current) {
    updateSubscription({ paused: !current.paused });
  }
};

export const cancelSubscription = (): void => {
  localStorage.removeItem(SUBSCRIPTION_KEY);
};

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
