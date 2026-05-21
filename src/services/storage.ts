import { QuoteCategory } from '../types';
import { pocketbaseService } from './pocketbase';

export interface PlaylistQuote {
  quoteId: string;
  quoteText: string;
  author: string;
  category: string | QuoteCategory;
  imageUrl: string;
  addedAt?: string | number;
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: string | number;
  quotes: PlaylistQuote[];
}

export interface Subscription {
  id?: string;
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
  verified?: boolean;
  createdAt?: string | number;
}

export interface VerificationData {
  code: string;
  identifier: string; // email or username
  expiresAt: number;
  attempts: number;
}

export const STORAGE_KEY = 'soulscript_playlists';
export const SUBSCRIPTION_KEY = 'soulscript_subscription';
export const VERIFICATION_KEY = 'soulscript_verification';

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

export const getSubscription = async (): Promise<Subscription | null> => {
  if (pocketbaseService.isValid()) {
    const sub = await pocketbaseService.getUserSubscription() as any;
    if (!sub) return null;
    return {
      ...sub,
      id: sub.id,
      createdAt: sub.created
    };
  }
  const data = localStorage.getItem(SUBSCRIPTION_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveSubscription = async (data: any): Promise<any> => {
  if (pocketbaseService.isValid()) {
    return await pocketbaseService.saveUserSubscription(data);
  }
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

export const updateSubscription = async (data: Partial<Subscription>): Promise<Subscription | null> => {
  if (pocketbaseService.isValid()) {
    const updated = await pocketbaseService.saveUserSubscription(data) as any;
    return { ...updated, id: updated.id, createdAt: updated.created };
  }
  const current = await getSubscription();
  if (!current) return null;
  const updated = { ...current, ...data };
  localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(updated));
  return updated;
};

export const pauseSubscription = async (): Promise<void> => {
  const current = await getSubscription();
  if (current) {
    await updateSubscription({ paused: !current.paused });
  }
};

export const cancelSubscription = async (): Promise<void> => {
  if (pocketbaseService.isValid()) {
    await pocketbaseService.deleteUserSubscription();
  } else {
    localStorage.removeItem(SUBSCRIPTION_KEY);
  }
};

export const getPlaylists = async (): Promise<Playlist[]> => {
  if (pocketbaseService.isValid()) {
    const lists = await pocketbaseService.getUserPlaylists();
    return lists as any[];
  }
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const createPlaylist = async (name: string): Promise<any> => {
  if (pocketbaseService.isValid()) {
    return await pocketbaseService.createUserPlaylist(name);
  }
  const playlists = await getPlaylists();
  
  // Guest limit check
  if (playlists.length >= 3) {
    throw new Error('GUEST_LIMIT_REACHED');
  }

  const newPlaylist: Playlist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: Date.now(),
    quotes: []
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...playlists, newPlaylist]));
  return newPlaylist;
};

export const deletePlaylist = async (id: string): Promise<void> => {
  if (pocketbaseService.isValid()) {
    await pocketbaseService.deleteUserPlaylist(id);
    return;
  }
  const playlists = await getPlaylists();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists.filter(p => p.id !== id)));
};

export const addQuoteToPlaylist = async (playlistId: string, quote: any): Promise<void> => {
  if (pocketbaseService.isValid()) {
    await pocketbaseService.addQuoteToUserPlaylist(playlistId, quote);
    return;
  }
  const playlists = await getPlaylists();
  const updatedPlaylists = playlists.map(p => {
    if (p.id === playlistId) {
      if (p.quotes.find(q => q.quoteId === quote.quoteId)) return p;
      return {
        ...p,
        quotes: [...p.quotes, { ...quote, addedAt: Date.now() }]
      };
    }
    return p;
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlaylists));
};

export const removeQuoteFromPlaylist = async (playlistId: string, quoteId: string): Promise<void> => {
  if (pocketbaseService.isValid()) {
    await pocketbaseService.removeQuoteFromUserPlaylist(playlistId, quoteId);
    return;
  }
  const playlists = await getPlaylists();
  const updatedPlaylists = playlists.map(p => {
    if (p.id === playlistId) {
      return {
        ...p,
        quotes: p.quotes.filter(q => q.quoteId !== quoteId)
      };
    }
    return p;
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlaylists));
};

