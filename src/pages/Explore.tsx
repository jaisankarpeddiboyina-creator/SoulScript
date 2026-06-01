import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Loader2, 
  X,
  FilterX, 
  Download, 
  Share2, 
  FileArchive,
  Image as ImageIcon,
  RefreshCw,
  Square
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { QuoteCard, QuoteCardHandle } from '../components/QuoteCard';
import JSZip from 'jszip';
import { Quote, QuoteCategory } from '../types';
import { CATEGORIES, FALLBACK_QUOTES } from '../constants';
import { cn } from '../lib/utils';
import { pocketbaseService } from '../services/pocketbase';

export const Explore: React.FC = () => {
  const { 
    exploreFilters, 
    viewMode, 
    addToast,
    setStagedFilters,
    setFilteredCount,
    isSelectMode,
    setIsSelectMode
  } = useApp();
  const { canDownload, incrementDownload, isLoggedIn } = useAuth();
  
  const { category, search, length: lengthFilter, sort } = exploreFilters;

  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Selection State
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [activeMenuQuoteId, setActiveMenuQuoteId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, QuoteCardHandle | null>>({});

  // Reset selection when exiting select mode
  useEffect(() => {
    if (!isSelectMode) {
      setSelectedQuoteIds(new Set());
    }
  }, [isSelectMode]);

  const toggleSelect = (id: string) => {
    setSelectedQuoteIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedQuoteIds.size === filteredQuotes.length) {
      setSelectedQuoteIds(new Set());
    } else {
      setSelectedQuoteIds(new Set(filteredQuotes.map(q => q._id)));
    }
  };

  const handleBulkDownload = async (format: 'zip' | 'gallery') => {
    setShowDownloadOptions(false);
    if (selectedQuoteIds.size === 0) return;
    
    if (!canDownload(selectedQuoteIds.size)) return;
    
    setIsBulkDownloading(true);
    addToast('Preparing your elegant cards...', 'info');

    try {
      if (format === 'zip') {
        const zip = new JSZip();
        
        for (const id of Array.from(selectedQuoteIds)) {
          const handle = cardRefs.current[id];
          if (handle) {
            const canvas = await handle.getCanvas();
            if (canvas) {
              const quote = filteredQuotes.find(q => q._id === id);
              const author = quote?.author || 'Unknown';
              const timestamp = Date.now();
              const filename = `SoulScript-${author.replace(/[^a-z0-9]/gi, '_')}-${timestamp}.png`;
              
              const base64Data = canvas.toDataURL('image/png').split(',')[1];
              zip.file(filename, base64Data, { base64: true });
            }
          }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `SoulScript-Bulk-${Date.now()}.zip`;
        link.click();
      } else {
        // Individual downloads
        for (const id of Array.from(selectedQuoteIds)) {
          const handle = cardRefs.current[id];
          if (handle) {
            const quote = filteredQuotes.find(q => q._id === id);
            const author = quote?.author || 'Unknown';
            const timestamp = Date.now();
            const filename = `SoulScript-${author.replace(/[^a-z0-9]/gi, '_')}-${timestamp}.png`;
            
            const canvas = await handle.getCanvas();
            if (canvas) {
              const link = document.createElement('a');
              link.href = canvas.toDataURL('image/png');
              link.download = filename;
              link.click();
              await new Promise(r => setTimeout(r, 400));
            }
          }
        }
      }
      
      await incrementDownload(selectedQuoteIds.size);
      
      addToast('✅ Downloaded cards successfully!', 'success');
      setIsSelectMode(false);
    } catch (err) {
      console.error('Bulk download failed', err);
      addToast('Download failed. Try selecting fewer cards.', 'error');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  // Re-fetch when category or page changes
  const fetchQuotes = async (pageNum: number, isNewCategory: boolean = false) => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      if (isNewCategory) {
        setAllQuotes([]);
      }

      const limit = 20;
      const skip = (pageNum - 1) * limit;
      const url = `https://dummyjson.com/quotes?limit=${limit}&skip=${skip}`;

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('API Rate Limit or Error');
      const data = await response.json();
      
      if (data.quotes) {
        const newResults = data.quotes.map((q: any) => ({
          _id: q.id.toString(),
          content: q.quote,
          author: q.author,
          tags: [category !== 'all' ? category : 'motivational'],
          dateAdded: new Date(Date.now() - q.id * 1000000).toISOString()
        })) as Quote[];
        
        // Save to PocketBase database cleanly with empty imageUrl
        if (isLoggedIn) {
          newResults.forEach(async (quote) => {
            await pocketbaseService.saveQuote({
              quoteId: quote._id,
              quoteText: quote.content,
              author: quote.author,
              category: quote.tags[0],
              tags: quote.tags,
              imageUrl: ""
            });
          });
        }

        setAllQuotes(prev => {
          if (isNewCategory) return newResults;
          const existingIds = new Set(prev.map(q => q._id));
          const uniqueNew = newResults.filter(q => !existingIds.has(q._id));
          return [...prev, ...uniqueNew];
        });
        
        setHasMore(skip + limit < data.total);
      }
    } catch (error) {
      const fallbackList = category === 'all' 
        ? Object.values(FALLBACK_QUOTES).flat() 
        : (FALLBACK_QUOTES[category] || FALLBACK_QUOTES.motivational);
      
      const mappedFallbacks = fallbackList.map((f, i) => ({
        ...f,
        _id: `fallback-${category}-${i}-${Date.now()}`,
        tags: [category === 'all' ? 'motivational' : category],
      })) as Quote[];
      
      if (isNewCategory || allQuotes.length === 0) {
        setAllQuotes(mappedFallbacks);
        setHasMore(false);
      }
      addToast('Using offline database (Network Slow)', 'info');
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    setFilteredCount(filteredQuotes.length);
  }, [filteredQuotes, setFilteredCount]);

  useEffect(() => {
    setStagedFilters(exploreFilters);
  }, [exploreFilters, setStagedFilters]);

  // Filter Pipeline
  useEffect(() => {
    let result = [...allQuotes];

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(q => 
        q.author.toLowerCase().includes(term) ||
        q.content.toLowerCase().includes(term) ||
        q.tags.some(t => t.toLowerCase().includes(term))
      );
    }

    if (lengthFilter !== 'all') {
      result = result.filter(q => {
        const len = q.content.length;
        if (lengthFilter === 'short') return len < 80;
        if (lengthFilter === 'medium') return len >= 80 && len <= 180;
        if (lengthFilter === 'long') return len > 180;
        return true;
      });
    }

    if (sort === 'random') {
      result = shuffleArray(result);
    } else if (sort === 'newest') {
      result = [...result].sort((a, b) => {
        const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return dateB - dateA;
      });
    } else if (sort === 'popular') {
      result = [...result].sort((a, b) => b.content.length - a.content.length);
    }

    setFilteredQuotes(result);
  }, [allQuotes, search, lengthFilter, sort]);

  useEffect(() => {
    setPage(1);
    fetchQuotes(1, true);
  }, [category]);

  useEffect(() => {
    if (page > 1) {
      fetchQuotes(page);
    }
  }, [page]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastQuoteElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && viewMode === 'reels') {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, viewMode]);

  return (
    <div className="space-y-0 md:space-y-4">
      {/* Content Area */}
      {viewMode === 'grid' ? (
        <div className="flex flex-col gap-0 md:gap-12 pb-[80px]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6 pt-0 md:pt-4">
            <AnimatePresence mode="popLayout">
              {loading && allQuotes.length === 0 ? (
                // Skeleton Grid
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="w-full h-[280px] md:h-[400px] shimmer-bg rounded-none" />
                ))
              ) : filteredQuotes.length > 0 ? (
                filteredQuotes.map((quote, index) => (
                  <motion.div
                    key={`${quote._id}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layout
                    style={{ zIndex: activeMenuQuoteId === quote._id ? 150 : 1 }}
                  >
                    <QuoteCard 
                      ref={el => cardRefs.current[quote._id] = el}
                      quote={quote} 
                      category={quote.tags[0]}
                      selectionMode={isSelectMode}
                      isSelected={selectedQuoteIds.has(quote._id)}
                      onToggleSelect={() => toggleSelect(quote._id)}
                      onMenuOpenChange={(isOpen) => setActiveMenuQuoteId(isOpen ? quote._id : null)}
                      className={cn(
                        "w-full h-auto",
                        quote.content.length > 150 ? "aspect-[9/16]" : quote.content.length < 60 ? "aspect-[9/13]" : "aspect-[9/15]"
                      )}
                    />
                  </motion.div>
                ))
              ) : !loading && (
                <div className="col-span-full py-20 w-full flex justify-center">
                  <div className="flex flex-col items-center justify-center gap-6 max-w-sm mx-auto text-center">
                    <div className="p-8 rounded-full bg-white/5 border border-white/5">
                      <FilterX className="w-16 h-16 text-indigo-400/50" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">No quotes found</h3>
                      <p className="text-gray-400 font-medium leading-relaxed">
                        We couldn't find any quotes matching your current filters. Try adjusting your search query.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {hasMore && !loading && allQuotes.length > 0 && (
            <div className="flex justify-center pb-20">
              <button
                onClick={() => setPage(prev => prev + 1)}
                className="group flex items-center gap-3 px-8 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 min-w-[200px] justify-center"
              >
                Explore More
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          )}

          {!hasMore && allQuotes.length > 0 && !loading && (
            <div className="flex flex-col items-center gap-4 py-20 opacity-40">
              <div className="h-px w-24 bg-white/20" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">You've seen it all</p>
              <div className="h-px w-24 bg-white/20" />
            </div>
          )}
        </div>
      ) : (
        <div className="fixed inset-0 z-20 bg-dark-bg overflow-y-auto snap-y snap-mandatory no-scrollbar h-[100dvh]">
          {loading && allQuotes.length === 0 ? (
            <div className="h-full w-full shimmer-bg" />
          ) : filteredQuotes.map((quote, index) => (
            <div 
              key={`${quote._id}-${index}`}
              ref={index === filteredQuotes.length - 1 ? lastQuoteElementRef : null}
              className="h-[100dvh] snap-start"
            >
              <QuoteCard 
                ref={el => cardRefs.current[quote._id] = el}
                quote={quote} 
                category={quote.tags[0]}
                variant="reels"
                selectionMode={isSelectMode}
                isSelected={selectedQuoteIds.has(quote._id)}
                onToggleSelect={() => toggleSelect(quote._id)}
                onSwipeUp={() => {
                  const scrollContainer = document.querySelector('.snap-mandatory');
                  if (scrollContainer) {
                    scrollContainer.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
                  }
                }}
                onSwipeDown={() => {
                  const scrollContainer = document.querySelector('.snap-mandatory');
                  if (scrollContainer) {
                    scrollContainer.scrollBy({ top: -window.innerHeight, behavior: 'smooth' });
                  }
                }}
              />
            </div>
          ))}
          {loading && allQuotes.length > 0 && (
            <div className="h-screen flex items-center justify-center flex-col gap-4 shimmer-bg">
               <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
               <p className="font-serif italic text-2xl">Fetching more inspiration...</p>
            </div>
          )}

          {!hasMore && filteredQuotes.length > 0 && (
            <div className="h-screen flex items-center justify-center flex-col gap-4 bg-dark-bg">
               <div className="p-8 rounded-full bg-white/5 border border-white/10">
                 <FilterX className="w-12 h-12 text-indigo-400/50" />
               </div>
               <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">End of the road</p>
            </div>
          )}
        </div>
      )}

      {loading && allQuotes.length > 0 && viewMode === 'grid' && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-indigo-400 w-8 h-8" />
        </div>
      )}

      {/* Floating Action Bar */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="fixed bottom-[88px] md:bottom-12 left-1/2 z-[1000] flex flex-row items-center justify-between gap-1.5 md:gap-3 p-1.5 md:p-2 bg-black/95 backdrop-blur-3xl rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] border border-white/20 w-[calc(100%-24px)] md:w-[calc(100%-48px)] max-w-2xl overflow-hidden pointer-events-auto"
          >
            <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
              <motion.button
                whileTap={{ scale: 0.96 }}
                id="bulk-select-all-btn"
                onClick={selectAll}
                className={cn(
                  "h-10 md:h-11 px-2.5 md:px-4 flex items-center justify-center gap-1.5 text-[10px] md:text-[12px] font-extrabold uppercase tracking-wider transition-all rounded-xl border cursor-pointer",
                  selectedQuoteIds.size === filteredQuotes.length 
                    ? "bg-white text-black border-white shadow-lg" 
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                )}
              >
                <Square id="select-all-icon" size={13} className={cn(selectedQuoteIds.size === filteredQuotes.length ? "fill-black" : "text-white/40")} />
                <span>{selectedQuoteIds.size === filteredQuotes.length ? 'NONE' : 'ALL'}</span>
              </motion.button>
              
              <div className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-500/10 border border-indigo-500/25 shrink-0">
                 <span className="text-[10px] md:text-[12px] font-black text-indigo-400">
                  {selectedQuoteIds.size}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-3 flex-1 justify-end min-w-0">
              <motion.button
                whileTap={{ scale: 0.96 }}
                id="bulk-cancel-btn"
                onClick={() => setIsSelectMode(false)}
                className="h-10 md:h-11 px-2.5 md:px-4 text-[10px] md:text-[12px] font-extrabold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center justify-center"
              >
                CANCEL
              </motion.button>
              <motion.button
                whileTap={selectedQuoteIds.size > 0 ? { scale: 0.96 } : {}}
                id="bulk-download-btn"
                onClick={() => setShowDownloadOptions(true)}
                disabled={selectedQuoteIds.size === 0 || isBulkDownloading}
                className={cn(
                  "h-10 md:h-11 px-3.5 md:px-5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl text-[10px] md:text-[12px] font-extrabold uppercase tracking-widest text-white shadow-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                  "disabled:opacity-20 disabled:grayscale disabled:scale-100 disabled:shadow-none disabled:cursor-not-allowed"
                )}
              >
                {isBulkDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={2.5} />}
                <span>DOWNLOAD</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Options Modal */}
      <AnimatePresence>
        {showDownloadOptions && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDownloadOptions(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xs glass-heavy rounded-3xl p-6 shadow-2xl border border-white/10 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Download Options</h3>
                <button onClick={() => setShowDownloadOptions(false)} className="text-gray-500 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleBulkDownload('zip')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-indigo-500/10 transition-all group"
                >
                  <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                    <FileArchive size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Download as ZIP</p>
                    <p className="text-[10px] text-gray-500 font-medium tracking-tight">Best for storage & offline share</p>
                  </div>
                </button>

                <button
                  onClick={() => handleBulkDownload('gallery')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-indigo-500/10 transition-all group "
                >
                  <div className="p-3 rounded-xl bg-pink-500/20 text-pink-400">
                    <ImageIcon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Save to Gallery</p>
                    <p className="text-[10px] text-gray-500 font-medium tracking-tight">Fastest single download trigger</p>
                  </div>
                </button>
              </div>
              
              <p className="mt-6 text-[9px] text-center text-gray-500 font-medium leading-relaxed">
                Perfect 9:16 high-resolution rendering. Clean & Minimal.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
