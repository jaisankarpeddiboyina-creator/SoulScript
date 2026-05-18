import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Library, ChevronRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPlaylists, createPlaylist, addQuoteToPlaylist, Playlist } from '../services/storage';

export const PlaylistModal: React.FC = () => {
  const { playlistModalQuote, setPlaylistModalQuote, addToast } = useApp();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    if (playlistModalQuote) {
      setPlaylists(getPlaylists());
    }
  }, [playlistModalQuote]);

  const handleAddToPlaylist = (playlistId: string, playlistName: string) => {
    if (!playlistModalQuote) return;
    
    addQuoteToPlaylist(playlistId, {
      id: playlistModalQuote.id,
      quoteText: playlistModalQuote.quoteText,
      author: playlistModalQuote.author,
      category: playlistModalQuote.category,
      imageUrl: playlistModalQuote.imageUrl
    });
    
    addToast(`Added to ${playlistName}`, 'success');
    setPlaylistModalQuote(null);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !playlistModalQuote) return;
    
    const newPlaylist = createPlaylist(newPlaylistName);
    handleAddToPlaylist(newPlaylist.id, newPlaylist.name);
    
    setNewPlaylistName('');
    setShowCreate(false);
  };

  if (!playlistModalQuote) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setPlaylistModalQuote(null)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-sm glass-heavy rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="p-8 pb-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif font-bold text-[var(--text-primary)]">Add to Playlist</h2>
            <button onClick={() => setPlaylistModalQuote(null)} className="p-2 -mr-2 text-gray-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>

          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-600/20 transition-all mb-4 group"
          >
            <div className="p-2 rounded-xl bg-indigo-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Plus size={20} />
            </div>
            <span className="text-sm">Create New Playlist</span>
          </button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-8 overflow-hidden"
            >
              <form onSubmit={handleCreateAndAdd} className="pb-6 flex gap-2">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Playlist name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="p-3 gradient-bg rounded-xl text-white shadow-lg disabled:opacity-50"
                >
                  <Check size={20} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 pb-8 max-h-[40vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-white/5 text-gray-500 group-hover:text-indigo-400 transition-colors">
                    <Library size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{playlist.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{playlist.quotes.length} {playlist.quotes.length === 1 ? 'Quote' : 'Quotes'}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-colors" />
              </button>
            ))}
            
            {playlists.length === 0 && !showCreate && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No playlists yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Preview Area */}
        <div className="bg-black/20 p-4 border-t border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
            <img src={playlistModalQuote.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Adding Quote</p>
            <p className="text-xs text-white/80 font-serif truncate italic">"{playlistModalQuote.quoteText}"</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
