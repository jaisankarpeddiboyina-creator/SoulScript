import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  Download, 
  PlusCircle,
  Loader2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { QuoteCard, drawQuoteCardCanvas } from '../components/QuoteCard';
import { 
  getQuotesByCategory, 
  getQuotesByAuthor, 
  getAllAuthors, 
  saveQuote, 
  checkQuoteExists,
  isPocketBaseHealthy
} from '../services/pocketbase';
import { PHOTO_KEYWORDS, CATEGORIES } from '../constants';
import axios from 'axios';
import JSZip from 'jszip';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const getCategoryGradient = (id: string) => {
  const gradients: Record<string, string> = {
    all: 'from-purple-900 to-indigo-900',
    motivational: 'from-[#1e1b4b] to-[#311042]',
    love: 'from-[#4c1d37] to-[#1e1b4b]',
    wisdom: 'from-[#115e59] to-[#1e1b4b]',
    humor: 'from-[#854d0e] to-[#311042]',
    life: 'from-[#1e3a8a] to-[#1e1b4b]',
    inspiration: 'from-[#701a75] to-[#311042]',
    philosophy: 'from-[#3c0764] to-[#160824]',
    friendship: 'from-[#311042] to-[#4c1d37]',
  };
  return gradients[id] || 'from-[#160824] to-[#340B2D]';
};

export const Collections: React.FC = () => {
  const { addToast } = useApp();
  const { canDownload } = useAuth();
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 100 });
  const [error, setError] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  
  // Detail selection states
  const [selectedCollection, setSelectedCollection] = useState<{
    type: 'category' | 'author';
    name: string;
    slug?: string;
  } | null>(null);
  
  const [collectionQuotes, setCollectionQuotes] = useState<any[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [activeMenuQuoteId, setActiveMenuQuoteId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const isHealthy = await isPocketBaseHealthy();
      if (!isHealthy) {
        setIsFallback(true);
        await loadFallbacks();
      } else {
        setIsFallback(false);
        const authorList = await getAllAuthors();
        setAuthors(authorList);
        if (authorList.length === 0) {
          // If fresh databases are empty, seed authors
          setSyncing(true);
          await syncQuotes();
        }
      }
    } catch (err) {
      console.error(err);
      setIsFallback(true);
      await loadFallbacks();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadFallbacks = async () => {
    try {
      const res = await axios.get('https://dummyjson.com/quotes?limit=100');
      const quotes = res.data.quotes.map((q: any) => ({
        _id: String(q.id),
        content: q.quote,
        author: q.author,
        authorSlug: q.author.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        tags: ['Life']
      }));
      
      const authorsMap: Record<string, any> = {};
      quotes.forEach((q: any) => {
        if (!authorsMap[q.authorSlug]) {
          authorsMap[q.authorSlug] = {
            name: q.author,
            slug: q.authorSlug,
            count: 1
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
    if (syncing) return;
    setSyncing(true);
    try {
      const totalToSync = 200; 
      setSyncProgress({ current: 0, total: totalToSync });

      for (let batch = 0; batch < 4; batch++) {
        const response = await axios.get(`https://dummyjson.com/quotes?limit=50&skip=${batch * 50}`);
        const quotes = response.data.quotes.map((q: any) => ({
          _id: String(q.id),
          content: q.quote,
          author: q.author,
          authorSlug: q.author.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          tags: ['Life']
        }));

        for (let i = 0; i < quotes.length; i++) {
          const q = quotes[i];
          const exists = await checkQuoteExists(q._id);
          if (exists) {
            setSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
            continue;
          }

          try {
            await saveQuote({
              quoteId: q._id,
              quoteText: q.content,
              author: q.author,
              authorSlug: q.authorSlug,
              category: q.tags[0] || 'Life',
              tags: q.tags,
              imageUrl: "",
            });
          } catch (imgErr) {
            console.error('Save failed', imgErr);
          }

          setSyncProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      }

      const authorList = await getAllAuthors();
      setAuthors(authorList);
      addToast('✅ Collections Sync complete!', 'success');
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
        const res = await axios.get('https://dummyjson.com/quotes?limit=100');
        const allQuotes = res.data.quotes.map((q: any) => ({
          _id: String(q.id),
          content: q.quote,
          author: q.author,
          authorSlug: q.author.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          tags: [type === 'category' ? name : 'Life']
        }));
        
        if (type === 'category') {
          quotesData = allQuotes.slice(0, 20);
        } else {
          quotesData = allQuotes.filter((q: any) => q.authorSlug === slug);
          if (quotesData.length === 0) {
            quotesData = allQuotes.slice(0, 10);
          }
        }
        
        const mappedQuotes = quotesData.map((q: any) => ({
          id: q._id,
          quoteId: q._id,
          quoteText: q.content,
          author: q.author,
          authorSlug: q.authorSlug,
          category: q.tags[0] || 'Life',
          imageUrl: ""
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
    
    if (!canDownload(selectedQuoteIds.length)) return;

    addToast('Preparing your offline collection ZIP...', 'info');
    const zip = new JSZip();
    const folder = zip.folder("SoulScript-Collection");

    const selectedQuotes = collectionQuotes.filter(q => selectedQuoteIds.includes(q.id));
    
    try {
      for (let i = 0; i < selectedQuotes.length; i++) {
        const q = selectedQuotes[i];
        
        // Generate high-resolution, brand-consistent quote cards natively and locally
        const canvas = await drawQuoteCardCanvas(q.quoteText || q.quote || '', q.author);
        if (canvas) {
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
          if (blob) {
            folder?.file(`${q.author.replace(/[^a-z0-9]/gi, '_')}-${i}.png`, blob);
          }
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SoulScript-Collection-${selectedCollection?.name}.zip`;
      link.click();
      
      addToast('✅ ZIP download started! CORS-free and pixel-perfect.', 'success');
      setSelectMode(false);
      setSelectedQuoteIds([]);
    } catch (err) {
       console.error('Bulk generate zip failed', err);
       addToast('❌ Failed to generate ZIP collection.', 'error');
    }
  };

  if (selectedCollection) {
    return (
      <div className="space-y-8 pb-32">
        {/* Detail Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setSelectedCollection(null);
                setSelectMode(false);
                setSelectedQuoteIds([]);
              }}
              className="p-3 bg-white/5 border border-white/10 rounded-2xl text-[var(--text-secondary)] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] font-black tracking-[0.2em] text-indigo-400 uppercase mb-1">
                {selectedCollection.type === 'category' ? 'Category Collection' : 'Author Collection'}
              </p>
              <h1 className="text-3xl md:text-4xl font-serif font-black text-white leading-tight">
                {selectedCollection.name}
              </h1>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectMode(!selectMode);
                setSelectedQuoteIds([]);
              }}
              className={cn(
                "px-6 py-3 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer block",
                selectMode 
                  ? "bg-purple-600/20 border-purple-500 text-purple-400" 
                  : "bg-white/5 border-white/10 text-[var(--text-primary)] hover:bg-white/10"
              )}
            >
              {selectMode ? 'Cancel Selection' : 'Select Multiple'}
            </button>

            {selectMode && selectedQuoteIds.length > 0 && (
              <button
                onClick={handleDownloadSelected}
                className="flex items-center gap-2 px-6 py-3 bg-[#EAB308] text-black hover:bg-[#FACC15] rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>Download ZIP ({selectedQuoteIds.length})</span>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6 pt-0 md:pt-4">
            {collectionQuotes.map((q) => (
              <div 
                key={q.id} 
                className="relative" 
                style={{ zIndex: activeMenuQuoteId === q.id ? 150 : 1 }}
              >
                <QuoteCard 
                  quote={{ content: q.quoteText || q.quote, author: q.author, _id: q.quoteId || q.id }}
                  selectionMode={selectMode}
                  isSelected={selectedQuoteIds.includes(q.id)}
                  onToggleSelect={() => {
                    setSelectedQuoteIds(prev => 
                      prev.includes(q.id) ? prev.filter(id => id !== q.id) : [...prev, q.id]
                    );
                  }}
                  onMenuOpenChange={(isOpen) => setActiveMenuQuoteId(isOpen ? q.id : null)}
                  className="w-full h-auto aspect-[9/15]"
                />
              </div>
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
        <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center gap-4 animate-in fade-in duration-300">
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
          {CATEGORIES.filter(cat => cat.id !== 'all').map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenCollection('category', cat.label)}
              className={cn(
                "relative group w-full h-24 sm:h-28 rounded-2xl border border-white/10 overflow-hidden shadow-xl"
              )}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity", getCategoryGradient(cat.id))} />
              <div className="relative p-3 h-full flex flex-col justify-end">
                <span className="text-sm font-bold text-white drop-shadow-md leading-tight">{cat.label}</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                {/* Clean, gold-on-premium gradient placeholder for authors */}
                <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#160824] to-[#340B2D] border border-white/5 flex items-center justify-center">
                  <span className="font-serif italic text-3xl text-[#FFD700] opacity-80 group-hover:scale-110 transition-transform duration-500 select-none">❝</span>
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
      
      {/* Retry/Sync Button */}
      {!syncing && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={syncQuotes}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest text-indigo-400 transition-all cursor-pointer"
          >
            <PlusCircle size={16} />
            {isFallback ? 'Fetch More Authors' : 'Sync More Quotes'}
          </button>
        </div>
      )}
    </div>
  );
};
