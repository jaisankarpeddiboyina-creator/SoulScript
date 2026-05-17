import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Library, 
  Search, 
  MoreVertical, 
  Trash2, 
  Clock, 
  ChevronRight,
  X,
  FileArchive,
  Download,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPlaylists, createPlaylist, deletePlaylist, removeQuoteFromPlaylist, Playlist } from '../services/storage';
import { QuoteCard, QuoteCardHandle } from '../components/QuoteCard';
import { cn } from '../lib/utils';
import JSZip from 'jszip';

export const Playlists: React.FC = () => {
  const { addToast } = useApp();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    setPlaylists(getPlaylists());
  }, []);

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    
    const newList = createPlaylist(newPlaylistName);
    setPlaylists([...playlists, newList]);
    setNewPlaylistName('');
    setShowCreateModal(false);
    addToast(`Created playlist: ${newList.name}`, 'success');
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeletePlaylist = (id: string, name: string) => {
    if (confirmDeleteId === id) {
      deletePlaylist(id);
      setPlaylists(playlists.filter(p => p.id !== id));
      setConfirmDeleteId(null);
      addToast(`Deleted playlist: ${name}`, 'info');
    } else {
      setConfirmDeleteId(id);
      // Reset confirmation state if user clicks away or after a timeout
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000);
    }
  };

  const handleRemoveQuote = (playlistId: string, quoteId: string) => {
    removeQuoteFromPlaylist(playlistId, quoteId);
    const updated = getPlaylists();
    setPlaylists(updated);
    if (activePlaylist?.id === playlistId) {
      setActivePlaylist(updated.find(p => p.id === playlistId) || null);
    }
    addToast('Removed from playlist', 'info');
  };

  const cardRefs = useRef<Record<string, QuoteCardHandle | null>>({});

  const downloadAllAsZip = async () => {
    if (!activePlaylist || activePlaylist.quotes.length === 0) return;
    
    setIsZipping(true);
    addToast('Preparing your playlist ZIP...', 'info');

    try {
      const zip = new JSZip();
      
      for (const quote of activePlaylist.quotes) {
        const handle = cardRefs.current[quote.id];
        if (handle) {
          const canvas = await handle.getCanvas();
          if (canvas) {
            const filename = `SoulScript-${quote.author.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.png`;
            const base64Data = canvas.toDataURL('image/png').split(',')[1];
            zip.file(filename, base64Data, { base64: true });
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `SoulScript-Playlist-${activePlaylist.name.replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.zip`;
      link.click();
      
      setIsZipping(false);
      addToast('Playlist downloaded!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Download failed', 'error');
      setIsZipping(false);
    }
  };

  const filteredPlaylists = playlists.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activePlaylist) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between sticky top-24 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActivePlaylist(null)}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors text-[var(--text-secondary)]"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold font-serif text-[var(--text-primary)]">{activePlaylist.name}</h1>
              <p className="text-xs text-[var(--text-secondary)] font-medium tracking-widest uppercase">
                {activePlaylist.quotes.length} Quotes
              </p>
            </div>
          </div>
          
          <button
            onClick={downloadAllAsZip}
            disabled={isZipping || activePlaylist.quotes.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 gradient-bg rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isZipping ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> : <FileArchive size={18} />}
            <span>Download All</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          <AnimatePresence>
            {activePlaylist.quotes.map((quote, idx) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
              >
                <QuoteCard
                  ref={el => cardRefs.current[quote.id] = el}
                  quote={{
                    _id: quote.id,
                    content: quote.quoteText,
                    author: quote.author,
                    tags: Array.isArray(quote.category) ? quote.category as any : [quote.category] as any,
                    length: 'medium', // fallback
                    likes: 0
                  }}
                  image={quote.imageUrl}
                  category={Array.isArray(quote.category) ? quote.category[0] as any : quote.category as any}
                  className="h-auto aspect-[3/4]"
                  // Overriding menu options for playlist
                  customMenuOptions={[
                    {
                      label: 'Remove from Playlist',
                      icon: <Trash2 size={16} className="text-rose-400" />,
                      onClick: () => handleRemoveQuote(activePlaylist.id, quote.id)
                    }
                  ]}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {activePlaylist.quotes.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-[var(--text-secondary)]">
              <div className="p-6 rounded-3xl bg-white/5 mb-4">
                <Library size={48} strokeWidth={1} />
              </div>
              <p className="text-xl font-serif">No quotes saved yet</p>
              <p className="text-sm mt-2">Add some quotes from the Explore page</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-[var(--text-primary)] mb-2">Your Library</h1>
          <p className="text-[var(--text-secondary)] font-medium tracking-tight">Curate your soul's collection</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text"
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm"
            />
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="p-3 gradient-bg rounded-2xl text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Grid of Playlists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredPlaylists.map((playlist, idx) => (
            <motion.div
              key={playlist.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setActivePlaylist(playlist)}
              className="group relative glass rounded-[2.5rem] p-6 cursor-pointer border border-[var(--border-color)] hover:border-indigo-500/50 transition-all hover:translate-y-[-4px] overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex -space-x-3">
                  {playlist.quotes.slice(0, 3).map((q, i) => (
                    <div 
                      key={q.id} 
                      className="w-12 h-12 rounded-full border-2 border-[var(--bg-primary)] overflow-hidden shadow-xl"
                      style={{ zIndex: 3 - i }}
                    >
                      <img src={q.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {playlist.quotes.length > 3 && (
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 border-2 border-[var(--bg-primary)] flex items-center justify-center text-[10px] font-black text-indigo-400 z-0">
                      +{playlist.quotes.length - 3}
                    </div>
                  )}
                  {playlist.quotes.length === 0 && (
                    <div className="w-12 h-12 rounded-full bg-white/5 border-2 border-[var(--bg-primary)] flex items-center justify-center text-gray-600">
                      <Library size={20} />
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePlaylist(playlist.id, playlist.name);
                    }}
                    className={cn(
                      "p-2 rounded-xl transition-all flex items-center gap-2",
                      confirmDeleteId === playlist.id 
                        ? "bg-rose-500 text-white px-4 ring-4 ring-rose-500/20" 
                        : "text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 md:opacity-0 md:group-hover:opacity-100 opacity-100"
                    )}
                    title={confirmDeleteId === playlist.id ? "Click again to delete" : "Delete Playlist"}
                  >
                    <Trash2 size={18} />
                    <AnimatePresence>
                      {confirmDeleteId === playlist.id && (
                        <motion.span 
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="text-[10px] font-black uppercase overflow-hidden whitespace-nowrap"
                        >
                          Sure?
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold font-serif text-[var(--text-primary)] mb-1 group-hover:text-indigo-400 transition-colors">{playlist.name}</h3>
                <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
                    <Clock size={10} />
                    <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md">
                    <span>{playlist.quotes.length} Quotes</span>
                  </div>
                </div>
              </div>

              <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-indigo-400">
                <ChevronRight size={24} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredPlaylists.length === 0 && searchQuery === '' && (
          <div 
            onClick={() => setShowCreateModal(true)}
            className="col-span-full border-2 border-dashed border-[var(--border-color)] rounded-[2.5rem] p-12 flex flex-col items-center justify-center group cursor-pointer hover:border-indigo-500/50 transition-all"
          >
            <div className="p-6 rounded-3xl bg-white/5 mb-4 group-hover:bg-indigo-500/10 transition-all">
              <Plus size={48} strokeWidth={1} className="text-gray-500 group-hover:text-indigo-400 transition-all" />
            </div>
            <p className="text-xl font-serif text-[var(--text-primary)]">Create your first playlist</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Start curating based on your mood</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-heavy rounded-[2.5rem] p-8 shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-[var(--text-primary)]">New Playlist</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreatePlaylist} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3">Playlist Name</label>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="E.g., Morning Motivation"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="w-full py-4 gradient-bg rounded-2xl text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  Create Playlist
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
