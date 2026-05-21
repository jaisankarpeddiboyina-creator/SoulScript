import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  Download, 
  Share2, 
  MoreVertical,
  PlusCircle,
  Loader2,
  Filter as FilterIcon,
  X,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { QuoteCard } from '../components/QuoteCard';
import { 
  getQuotesByCategory, 
  getQuotesByAuthor, 
  getAllAuthors, 
  saveQuote, 
  checkQuoteExists,
  isPocketBaseHealthy
} from '../services/pocketbase';
import { PHOTO_KEYWORDS } from '../constants';
import axios from 'axios';
import JSZip from 'jszip';

const CATEGORIES = [
  { name: 'Motivational', gradient: 'from-purple-600 to-indigo-600' },
  { name: 'Wisdom', gradient: 'from-indigo-600 to-blue-600' },
  { name: 'Love', gradient: 'from-rose-600 to-pink-600' },
  { name: 'Success', gradient: 'from-green-600 to-emerald-600' },
  { name: 'Life', gradient: 'from-orange-600 to-amber-600' },
  { name: 'Stoicism', gradient: 'from-gray-600 to-slate-600' },
  { name: 'Religion', gradient: 'from-teal-600 to-cyan-600' },
  { name: 'Humor', gradient: 'from-yellow-600 to-orange-600' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const Collections: React.FC = () => {
  const { addToast } = useApp();
  const { isGuest, isLoggedIn, setGatingType } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [isFallback, setIsFallback] = useState(false);
  
  const [authors, setAuthors] = useState<any[]>([]);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  
  const [selectedCollection, setSelectedCollection] = useState<{ type: 'category' | 'author', name: string, slug?: string } | null>(null);
  const [collectionQuotes, setCollectionQuotes] = useState<any[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(false);

  // Select mode for collection view
  const [selectMode, setSelectMode] = useState(false);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      if (isGuest) {
        setIsFallback(true);
        await loadFallbackData();
        return;
      }
      
      const healthy = await isPocketBaseHealthy();
      if (!healthy) {
        setIsFallback(true);
        await loadFallbackData();
        return;
      }
      
      setIsFallback(false);
      const authorList = await getAllAuthors();
      if (authorList.length === 0) {
        await syncQuotes();
      } else {
        setAuthors(authorList);
      }
    } catch (err) {
      console.error(err);
      setIsFallback(true);
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    try {
      // Fetch a bunch of random quotes to extract authors via proxy
      const response = await axios.get('/api/quotes/random?limit=50');
      const quotes = response.data;
      
      const authorsMap: Record<string, any> = {};
      // Initialize with existing authors
      authors.forEach(a => {
        authorsMap[a.slug] = { ...a };
      });

      quotes.forEach((q: any) => {
        if (!authorsMap[q.authorSlug]) {
          authorsMap[q.authorSlug] = {
            name: q.author,
            slug: q.authorSlug,
            count: 1,
            // Use author name as keyword and slug as cache breaker for uniqueness
            // Use safe photo keywords instead of author name to avoid human faces
            firstImage: `https://loremflickr.com/800/445/${PHOTO_KEYWORDS[Math.floor(Math.random() * PHOTO_KEYWORDS.length)]}?random=${q.authorSlug}`
          };
        } else {
          authorsMap[q.authorSlug].count++;
        }
      });
      setAuthors(Object.values(authorsMap).sort((a, b) => b.count - a.count));
    } catch (err) {
      setError(true);
      addToast('Failed to load fallback data', 'error');
    }
  };

  const syncQuotes = async () => {
    if (isGuest) {
      setGatingType('auth_required');
      return;
    }

    if (isFallback) {
      setSyncing(true);
      await loadFallbackData();
      setSyncing(false);
      return;
    }
    
    setSyncing(true);
    try {
      // Fetch in batches to reach ~200 as per requirement example
      const totalToSync = 200; 
      setSyncProgress({ current: 0, total: totalToSync });

      // Simulate batches
      for (let batch = 0; batch < 4; batch++) {
        const response = await axios.get('/api/quotes/random?limit=50');
        const quotes = response.data;

        for (let i = 0; i < quotes.length; i++) {
          const q = quotes[i];
          
          // Check if exists
          const exists = await checkQuoteExists(q._id);
          if (exists) {
            setSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
            continue;
          }

          // Get resolved image URL - using safe keywords and quote ID for uniqueness
          const safeKeyword = PHOTO_KEYWORDS[i % PHOTO_KEYWORDS.length];
          const imageUrl = `https://loremflickr.com/1920/1080/${safeKeyword}?random=${q._id}`;
          
          try {
            const resolveRes = await axios.get(`/api/resolve-image?url=${encodeURIComponent(imageUrl)}`);
            const finalImageUrl = resolveRes.data.url;

            await saveQuote({
              quoteId: q._id,
              quoteText: q.content,
              author: q.author,
              authorSlug: q.authorSlug,
              category: q.tags[0] || 'Life',
              tags: q.tags,
              imageUrl: finalImageUrl,
            });
          } catch (imgErr) {
            console.error('Image resolution failed', imgErr);
          }

          setSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      }

      // Reload authors
      const authorList = await getAllAuthors();
      setAuthors(authorList);
      addToast('Sync complete!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenCollection = async (type: 'category' | 'author', name: string, slug?: string) => {
    setSelectedCollection({ type, name, slug });
    setCollectionLoading(true);
    setCollectionQuotes([]);
    try {
      if (isFallback) {
        let quotesData = [];
        if (type === 'category') {
          const res = await axios.get(`/api/quotes?tags=${name.toLowerCase()}&limit=20`);
          quotesData = res.data.results;
        } else {
          const res = await axios.get(`/api/quotes?author=${slug}&limit=20`);
          quotesData = res.data.results;
        }
        
        const mappedQuotes = quotesData.map((q: any) => ({
          id: q._id,
          quoteId: q._id,
          quoteText: q.content,
          author: q.author,
          authorSlug: q.authorSlug,
          category: q.tags[0] || 'Life',
          // Use safe keywords to ensure no human faces
          imageUrl: `https://loremflickr.com/1920/1080/${PHOTO_KEYWORDS[Math.floor(Math.random() * PHOTO_KEYWORDS.length)]}?random=${q._id}`
        }));
        setCollectionQuotes(mappedQuotes);
      } else {
        let res;
        if (type === 'category') {
          res = await getQuotesByCategory(name);
        } else {
          res = await getQuotesByAuthor(slug || '');
        }
        setCollectionQuotes(res.items);
      }
    } catch (err) {
      addToast('Failed to load quotes', 'error');
    } finally {
      setCollectionLoading(false);
    }
  };

  const filteredAuthors = authors.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLetter = !activeLetter || a.name.toUpperCase().startsWith(activeLetter);
    return matchesSearch && matchesLetter;
  });

  const handleDownloadSelected = async () => {
    if (selectedQuoteIds.length === 0) return;
    
    addToast('Preparing ZIP...', 'info');
    const zip = new JSZip();
    const folder = zip.folder("SoulScript-Collection");

    const selectedQuotes = collectionQuotes.filter(q => selectedQuoteIds.includes(q.id));

    // In a real app with many images, we'd need to fetch blobs.
    // For now, let's just add a readme or try to fetch if CORS allows.
    // However, the requirement says "Download selected as ZIP"
    // Usually this means the images.
    
    try {
      for (let i = 0; i < selectedQuotes.length; i++) {
        const q = selectedQuotes[i];
        // We can't easily capture canvases for all selected cards without rendering them hiddenly
        // But we can try to fetch the raw images
        const response = await fetch(q.imageUrl);
        const blob = await response.blob();
        folder?.file(`${q.author}-${i}.jpg`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SoulScript-${selectedCollection?.name}.zip`;
      link.click();
      addToast('Download started!', 'success');
    } catch (err) {
       addToast('Failed to generate ZIP. CORS issues might prevent direct image fetching.', 'error');
    }
  };

  if (selectedCollection) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSelectedCollection(null);
                setSelectMode(false);
                setSelectedQuoteIds([]);
              }}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-[var(--text-secondary)]"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-[var(--text-primary)]">{selectedCollection.name}</h1>
              <p className="text-[var(--text-secondary)] text-sm">{collectionQuotes.length} {collectionQuotes.length === 1 ? 'Quote' : 'Quotes'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectMode ? (
              <>
                <button 
                  onClick={() => setSelectMode(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDownloadSelected}
                  disabled={selectedQuoteIds.length === 0}
                  className="px-6 py-2 gradient-bg rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
                >
                  Download ({selectedQuoteIds.length})
                </button>
              </>
            ) : (
              <button 
                onClick={() => setSelectMode(true)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-indigo-400"
                title="Select Mode"
              >
                <PlusCircle size={20} />
              </button>
            )}
          </div>
        </div>

        {collectionLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-indigo-400">
            <Loader2 className="animate-spin" size={40} />
            <p className="text-sm font-black uppercase tracking-widest">Loading Collection...</p>
          </div>
        ) : collectionQuotes.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-[var(--text-secondary)]">No quotes found in this collection</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {collectionQuotes.map((q) => (
              <QuoteCard 
                key={q.id}
                quote={{ content: q.quoteText, author: q.author, _id: q.quoteId }}
                image={q.imageUrl}
                category={q.category}
                selectionMode={selectMode}
                isSelected={selectedQuoteIds.includes(q.id)}
                onToggleSelect={() => {
                  setSelectedQuoteIds(prev => 
                    prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32 md:pb-12 min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Library className="text-indigo-400" size={32} />
          <h1 className="text-5xl font-serif font-bold text-[var(--text-primary)]">Collections</h1>
        </div>
        <p className="text-[var(--text-secondary)] max-w-xl">
          Browse curated quote collections by theme or discover deep insights from your favorite authors.
        </p>
      </div>

      {syncing && (
        <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center gap-4">
          <Loader2 className="animate-spin text-indigo-400" size={24} />
          <div className="flex-1">
            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-indigo-400 mb-2">
              <span>{isFallback ? 'Fetching quotes...' : 'Syncing quotes...'}</span>
              {!isFallback && <span>{syncProgress.current}/{syncProgress.total}</span>}
            </div>
            {!isFallback && (
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full gradient-bg transition-all duration-500" 
                  style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 1 - BY CATEGORY */}
      <section className="space-y-6">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
          <div className="h-px w-8 bg-indigo-400" />
          By Category
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 px-1">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenCollection('category', cat.name)}
              className={cn(
                "relative group w-full h-24 sm:h-28 rounded-2xl border border-white/10 overflow-hidden shadow-xl"
              )}
            >
              <div className={cn("absolute inset-0 bg-linear-to-br opacity-80 group-hover:opacity-100 transition-opacity", cat.gradient)} />
              <div className="relative p-3 h-full flex flex-col justify-end">
                <span className="text-sm font-bold text-white drop-shadow-md leading-tight">{cat.name}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* SECTION 2 - BY AUTHOR */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2 shrink-0">
            <div className="h-px w-8 bg-indigo-400" />
            By Author
          </h2>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search authors..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* A-Z Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveLetter(null)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold transition-all",
              activeLetter === null ? "bg-indigo-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            All
          </button>
          {ALPHABET.map(letter => (
            <button
              key={letter}
              onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all",
                activeLetter === letter ? "bg-indigo-600 text-white shadow-lg" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              {letter}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-center py-12 bg-red-500/10 border border-red-500/20 rounded-3xl space-y-4">
            <p className="text-red-400 text-sm font-medium">Failed to load authors. Please check your connection or PocketBase setup.</p>
            <button 
              onClick={loadData}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Retry Load
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
              <div key={i} className="aspect-[4/5] glass border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredAuthors.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-[var(--text-secondary)]">
              {searchQuery ? "No authors match your search" : "No quotes found for any author"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {filteredAuthors.map((author) => (
              <motion.button
                key={author.slug}
                whileHover={{ y: -5 }}
                onClick={() => handleOpenCollection('author', author.name, author.slug)}
                className="group bg-neutral-900/40 backdrop-blur-xl border border-white/10 hover:border-indigo-500/30 rounded-2xl sm:rounded-3xl p-3 flex flex-col gap-3 text-left transition-all shadow-2xl"
              >
                <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black/40">
                  <img 
                    src={author.firstImage} 
                    alt={author.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" 
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-2 right-2">
                    <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-600/40">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
                <div className="px-1 pb-1">
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-white group-hover:text-indigo-400 transition-colors leading-normal whitespace-normal">{author.name}</h3>
                  <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest">{author.count} {author.count === 1 ? 'Quote' : 'Quotes'}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>
      
      {/* Retry/Sync Button if authors list is small or user wants fresh data */}
      {!syncing && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={syncQuotes}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-400 transition-all"
          >
            <PlusCircle size={16} />
            {isFallback ? 'Fetch More Authors' : 'Sync More Quotes'}
          </button>
        </div>
      )}
    </div>
  );
};
