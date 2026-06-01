/* POCKETBASE COLLECTIONS REQUIRED

Collection: users (built-in auth collection)
Extra fields:
- plan: text (default: "free")
- downloadsToday: number (default: 0)
- lastDownloadDate: text (e.g. "2024-05-18")

Collection: playlists
Fields:
- userId: relation to users
- name: text
- createdAt: datetime

Collection: playlist_quotes
Fields:
- playlistId: relation to playlists
- quoteId: text
- quoteText: text
- author: text
- category: text
- imageUrl: text
- addedAt: datetime

Collection: subscriptions
Fields:
- userId: relation to users
- channel: text
- email: text
- chatId: text
- username: text
- category: text
- mood: text
- count: number
- frequency: text
- timeOfDay: text
- timezone: text
- paused: boolean
- lastSentAt: datetime

Collection: quotes
Fields:
- quoteId: text
- quoteText: text
- author: text
- authorSlug: text
- category: text
- tags: json
- imageUrl: text

Collection: verifications
Fields:
- identifier: text
- code: text
- channel: text
- expiresAt: datetime
- verified: boolean

*/

import PocketBase from 'pocketbase';

export const formatPocketBaseUrl = (url?: string): string => {
  if (!url) return 'http://127.0.0.1:8090';
  let formatted = url.trim();
  if (!/^https?:\/\//i.test(formatted)) {
    if (formatted.startsWith('localhost') || formatted.startsWith('127.0.0.1') || formatted.startsWith('0.0.0.0')) {
      formatted = 'http://' + formatted;
    } else {
      formatted = 'https://' + formatted;
    }
  }
  return formatted;
};

export const pb = new PocketBase(formatPocketBaseUrl(import.meta.env.VITE_POCKETBASE_URL));

// Auth Methods
export const signUp = async (data: any) => {
  return await pb.collection('users').create({
    ...data,
    emailVisibility: true,
  });
};

export const signIn = async (email: string, password: string) => {
  return await pb.collection('users').authWithPassword(email, password);
};

export const signInWithGoogle = async () => {
  return await pb.collection('users').authWithOAuth2({ provider: 'google' });
};

export const signOut = () => {
  pb.authStore.clear();
};

export const getCurrentUser = () => {
  return pb.authStore.model;
};

export const requestPasswordReset = async (email: string) => {
  return await pb.collection('users').requestPasswordReset(email);
};

// Data Methods
export const getQuotesByCategory = async (category: string) => {
  try {
    return await pb.collection('quotes').getList(1, 100, {
      filter: `category = "${category}"`,
      sort: '-created',
    });
  } catch (e) {
    return { items: [] };
  }
};

export const getQuotesByAuthor = async (authorSlug: string) => {
  try {
    return await pb.collection('quotes').getList(1, 100, {
      filter: `authorSlug = "${authorSlug}"`,
      sort: '-created',
    });
  } catch (e) {
    return { items: [] };
  }
};

export const getAllAuthors = async () => {
  try {
    return await pb.collection('authors').getFullList({ sort: '-count' });
  } catch (e) {
    return [];
  }
};

export const saveQuote = async (data: any) => {
  try {
    // Check if exists first
    const exists = await checkQuoteExists(data.quoteId);
    if (exists) return;
    return await pb.collection('quotes').create(data);
  } catch (e) {
    console.error('Failed to save quote to PB', e);
  }
};

export const checkQuoteExists = async (quoteId: string) => {
  try {
    await pb.collection('quotes').getFirstListItem(`quoteId="${quoteId}"`);
    return true;
  } catch (e) {
    return false;
  }
};

// Playlists
export const getUserPlaylists = async () => {
  const user = pb.authStore.model;
  if (!user) return [];
  try {
    const playlists = await pb.collection('playlists').getFullList({
      filter: `userId = "${user.id}"`,
      sort: '-created',
    });
    
    // Fetch quotes for each playlist
    const playlistsWithQuotes = await Promise.all(playlists.map(async (pl) => {
      const records = await pb.collection('playlist_quotes').getFullList({
        filter: `playlistId = "${pl.id}"`,
        sort: 'addedAt',
      });
      return {
        id: pl.id,
        name: pl.name,
        createdAt: pl.created,
        quotes: records.map(r => ({
          quoteId: r.quoteId,
          quoteText: r.quoteText,
          author: r.author,
          category: r.category,
          imageUrl: r.imageUrl
        }))
      };
    }));
    return playlistsWithQuotes;
  } catch (e) {
    return [];
  }
};

export const createUserPlaylist = async (name: string) => {
  const user = pb.authStore.model;
  if (!user) return;
  return await pb.collection('playlists').create({
    userId: user.id,
    name,
  });
};

export const deleteUserPlaylist = async (playlistId: string) => {
  try {
    const quotes = await pb.collection('playlist_quotes').getFullList({
      filter: `playlistId = "${playlistId}"`
    });
    await Promise.all(quotes.map(q => pb.collection('playlist_quotes').delete(q.id)));
  } catch (e) {}
  return await pb.collection('playlists').delete(playlistId);
};

export const addQuoteToUserPlaylist = async (playlistId: string, quote: any) => {
  return await pb.collection('playlist_quotes').create({
    playlistId,
    quoteId: quote.quoteId,
    quoteText: quote.quoteText,
    author: quote.author,
    category: quote.category,
    imageUrl: quote.imageUrl,
    addedAt: new Date().toISOString(),
  });
};

export const removeQuoteFromUserPlaylist = async (playlistId: string, quoteId: string) => {
  try {
    const record = await pb.collection('playlist_quotes').getFirstListItem(
      `playlistId = "${playlistId}" && quoteId = "${quoteId}"`
    );
    return await pb.collection('playlist_quotes').delete(record.id);
  } catch (e) {
    return null;
  }
};

// Subscriptions
export const getUserSubscription = async () => {
  const user = pb.authStore.model;
  if (!user) return null;
  try {
    return await pb.collection('subscriptions').getFirstListItem(`userId = "${user.id}"`);
  } catch (e) {
    return null;
  }
};

export const saveUserSubscription = async (data: any) => {
  const user = pb.authStore.model;
  if (!user) return;
  try {
    const existing = await getUserSubscription();
    if (existing) {
      return await pb.collection('subscriptions').update(existing.id, data);
    } else {
      return await pb.collection('subscriptions').create({
        userId: user.id,
        ...data,
      });
    }
  } catch (e) {
    return await pb.collection('subscriptions').create({
      userId: user.id,
      ...data,
    });
  }
};

export const deleteUserSubscription = async () => {
  const existing = await getUserSubscription();
  if (existing) {
    return await pb.collection('subscriptions').delete(existing.id);
  }
};

// Profile logic
export const updateProfile = async (userId: string, data: any) => {
  return await pb.collection('users').update(userId, data);
};

export const uploadAvatar = async (userId: string, file: File) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return await pb.collection('users').update(userId, formData);
};

export const changePassword = async (oldPassword: string, newPassword: string, newPasswordConfirm: string) => {
  const user = pb.authStore.model;
  if (!user) throw new Error('Not authenticated');
  return await pb.collection('users').update(user.id, {
    oldPassword,
    password: newPassword,
    passwordConfirm: newPasswordConfirm,
  });
};

export const deleteAccount = async () => {
  const user = pb.authStore.model;
  if (!user) throw new Error('Not authenticated');
  await pb.collection('users').delete(user.id);
  pb.authStore.clear();
};

export const getDownloadCount = () => {
  const user = pb.authStore.model;
  return user?.downloadsToday || 0;
};

export const incrementDownloadCount = async (count: number = 1) => {
  const user = pb.authStore.model;
  if (!user) return;
  
  const current = user.downloadsToday || 0;
  return await pb.collection('users').update(user.id, {
    downloadsToday: current + count,
    lastDownloadDate: new Date().toISOString().split('T')[0]
  });
};

export const resetDownloadCount = async () => {
  const user = pb.authStore.model;
  if (!user) return;
  return await pb.collection('users').update(user.id, {
    downloadsToday: 0,
    lastDownloadDate: new Date().toISOString().split('T')[0]
  });
};

export const isPocketBaseHealthy = async () => {
  try {
    const health = await pb.health.check();
    return health.code === 200;
  } catch (e) {
    return false;
  }
};

// Service Object for Context
export const pocketbaseService = {
  pb,
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  requestPasswordReset,
  getQuotesByCategory,
  getQuotesByAuthor,
  getAllAuthors,
  saveQuote,
  checkQuoteExists,
  getUserPlaylists,
  createUserPlaylist,
  deleteUserPlaylist,
  addQuoteToUserPlaylist,
  removeQuoteFromUserPlaylist,
  getUserSubscription,
  saveUserSubscription,
  deleteUserSubscription,
  updateProfile,
  uploadAvatar,
  changePassword,
  deleteAccount,
  getDownloadCount,
  incrementDownloadCount,
  resetDownloadCount,
  isPocketBaseHealthy,
  isValid: () => pb.authStore.isValid,
  onChange: (callback: (token: string, model: any) => void) => pb.authStore.onChange(callback)
};
