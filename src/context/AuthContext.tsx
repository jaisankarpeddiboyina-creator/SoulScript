import React, { createContext, useContext, useEffect, useState } from 'react';
import { pocketbaseService } from '../services/pocketbase';
import { STORAGE_KEY, SUBSCRIPTION_KEY } from '../services/storage';

export type GatingType = 'guest_limit' | 'free_limit' | 'basic_limit' | 'premium_feature' | 'auth_required' | null;

interface AuthContextType {
  user: any;
  isLoggedIn: boolean;
  isLoading: boolean;
  isPremium: boolean;
  isGuest: boolean;
  plan: string;
  downloadsToday: number;
  downloadsLimit: number;
  isAtLimit: boolean;
  gatingType: GatingType;
  setGatingType: (type: GatingType) => void;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (data: any) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => void;
  requestPasswordReset: (email: string) => Promise<any>;
  updateProfile: (data: any) => Promise<any>;
  deleteAccount: () => Promise<void>;
  canDownload: (count?: number) => boolean;
  incrementDownload: (count?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(pocketbaseService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [gatingType, setGatingType] = useState<GatingType>(null);
  const [guestDownloads, setGuestDownloads] = useState(() => {
    const saved = localStorage.getItem('guest_downloads');
    if (saved) {
      const data = JSON.parse(saved);
      const today = new Date().toISOString().split('T')[0];
      if (data.resetAt !== today) {
        return { count: 0, resetAt: today };
      }
      return data;
    }
    return { count: 0, resetAt: new Date().toISOString().split('T')[0] };
  });

  const isLoggedIn = !!user;
  const isPremium = true; // All limits and premium features are 100% free for everyone!
  const isGuest = !user;
  const plan: string = 'community';
  
  const downloadsToday = isGuest ? guestDownloads.count : (user?.downloadsToday || 0);
  const downloadsLimit = Infinity; // Unlimited downloads
  const isAtLimit = false;

  useEffect(() => {
    // Check initial auth state
    const current = pocketbaseService.getCurrentUser();
    setUser(current);
    setIsLoading(false);

    if (current) {
      const today = new Date().toISOString().split('T')[0];
      if (current.lastDownloadDate !== today) {
        pocketbaseService.resetDownloadCount();
      }
    }

    // Subscribe to auth changes
    const unsubscribe = pocketbaseService.onChange((token, model) => {
      const prevUser = user;
      setUser(model);
      
      if (model) {
        // Reset downloads if today is different
        const today = new Date().toISOString().split('T')[0];
        if (model.lastDownloadDate !== today) {
          pocketbaseService.resetDownloadCount();
        }

        // Migration logic if user just logged in
        if (!prevUser) {
          handleMigration();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMigration = async () => {
    try {
      // 1. Migrate Playlists
      const localPlaylistsRaw = localStorage.getItem(STORAGE_KEY);
      if (localPlaylistsRaw) {
        const localPlaylists = JSON.parse(localPlaylistsRaw);
        if (localPlaylists.length > 0) {
          for (const list of localPlaylists) {
            const pbList = await pocketbaseService.createUserPlaylist(list.name);
            if (pbList && list.quotes && list.quotes.length > 0) {
              for (const quote of list.quotes) {
                await pocketbaseService.addQuoteToUserPlaylist(pbList.id, quote);
              }
            }
          }
          localStorage.removeItem(STORAGE_KEY);
          // Toast will be shown by components if possible, or we could add a toast state here
          // For now, satisfy requirement manually via console or just assume UI handles it
          console.log('Migration completed');
        }
      }

      // 2. Migrate Subscription
      const localSubRaw = localStorage.getItem(SUBSCRIPTION_KEY);
      if (localSubRaw) {
        const localSub = JSON.parse(localSubRaw);
        await pocketbaseService.saveUserSubscription(localSub);
        localStorage.removeItem(SUBSCRIPTION_KEY);
      }
    } catch (e) {
      console.error('Migration failed', e);
    }
  };

  useEffect(() => {
    if (isGuest) {
      localStorage.setItem('guest_downloads', JSON.stringify(guestDownloads));
    }
  }, [guestDownloads, isGuest]);

  const signIn = async (email: string, password: string) => {
    return await pocketbaseService.signIn(email, password);
  };

  const signUp = async (data: any) => {
    return await pocketbaseService.signUp(data);
  };

  const signInWithGoogle = async () => {
    return await pocketbaseService.signInWithGoogle();
  };

  const signOut = () => {
    // Clear local cache for security
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
    pocketbaseService.signOut();
  };

  const requestPasswordReset = async (email: string) => {
    return await pocketbaseService.requestPasswordReset(email);
  };

  const updateProfile = async (data: any) => {
    if (!user) throw new Error('Not authenticated');
    return await pocketbaseService.updateProfile(user.id, data);
  };

  const deleteAccount = async () => {
    await pocketbaseService.deleteAccount();
  };

  const canDownload = (count: number = 1) => {
    if (isPremium) return true;
    if (downloadsToday + count > downloadsLimit) {
      if (isGuest) setGatingType('guest_limit');
      else if (plan === 'basic') setGatingType('basic_limit');
      else setGatingType('free_limit');
      return false;
    }
    return true;
  };

  const incrementDownload = async (count: number = 1) => {
    if (isPremium) return;
    
    if (isGuest) {
      setGuestDownloads(prev => ({
        ...prev,
        count: prev.count + count
      }));
    } else {
      await pocketbaseService.incrementDownloadCount(count);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoggedIn,
      isLoading,
      isPremium,
      isGuest,
      plan,
      downloadsToday,
      downloadsLimit,
      isAtLimit,
      gatingType,
      setGatingType,
      signIn, 
      signUp, 
      signInWithGoogle, 
      signOut, 
      requestPasswordReset,
      updateProfile,
      deleteAccount,
      canDownload,
      incrementDownload
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


