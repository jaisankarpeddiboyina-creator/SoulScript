import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  LayoutGrid, 
  Smartphone, 
  Loader2, 
  X,
  FilterX, 
  ArrowUpDown,
  Palette,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QuoteCard } from '../components/QuoteCard';
import { Quote, ViewMode, QuoteLength, QuoteCategory, QuoteSort } from '../types';
import { CATEGORIES, CATEGORY_MAP, FALLBACK_QUOTES, SORT_OPTIONS } from '../constants';
import { cn } from '../lib/utils';

export const Explore: React.FC = () => {
  const { 
    exploreFilters, 
    viewMode, 
    addToast,
    stagedFilters,
    setStagedFilters,
    filteredCount,
    setFilteredCount
  } = useApp();
  
  const { category, search, length: lengthFilter, sort } = exploreFilters;

  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const usedLocks = useRef<Set<number>>(new Set());

  // Re-fetch when category or page changes
  const fetchQuotes = async (pageNum: number, isNewCategory: boolean = false) => {
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      if (isNewCategory) {
        setAllQuotes([]);
        setImages({});
        usedLocks.current.clear();
      }

      const limit = 20;
      const skip = (pageNum - 1) * limit;
      const url = `/api/dummy/quotes?limit=${limit}&skip=${skip}`;

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
        
        setAllQuotes(prev => {
          if (isNewCategory) return newResults;
          const existingIds = new Set(prev.map(q => q._id));
          const uniqueNew = newResults.filter(q => !existingIds.has(q._id));
          return [...prev, ...uniqueNew];
        });
        
        setHasMore(skip + limit < data.total);
        generateImagesForQuotes(newResults, isNewCategory ? 0 : allQuotes.length);
      }
    } catch (error) {
      // Silent error handling for NetworkError or API failure
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
        generateImagesForQuotes(mappedFallbacks, 0);
      }
      addToast('Using offline database (Network Slow)', 'info');
    } finally {
      setLoading(false);
    }
  };


  const generateImagesForQuotes = (newQuotes: Quote[], startIndex: number) => {
    const updatedImages: Record<string, string> = { ...images };
    
    const isMobile = window.innerWidth < 768;
    newQuotes.forEach((quote, i) => {
      const idx = startIndex + i;
      const categoryOptions = CATEGORY_MAP[category] || CATEGORY_MAP.all;
      const catKeyword = categoryOptions[idx % categoryOptions.length];
      const keyword = catKeyword;
      
      // Technique 1 & 3: Unique lock per quote, track used locks
      let lock = Math.floor(Math.random() * 10000);
      while (usedLocks.current.has(lock)) {
        lock = Math.floor(Math.random() * 10000);
      }
      usedLocks.current.add(lock);
      
      updatedImages[quote._id] = `https://loremflickr.com/${isMobile ? "800/1000" : "1920/1080"}/${encodeURIComponent(keyword)}?lock=${lock}&cors=1`;
    });
    
    setImages(prev => ({ ...prev, ...updatedImages }));
  };

  // Shuffling logic
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

  // Sync staged filters logic (optional if handled in AppContext, but let's keep it robust)
  useEffect(() => {
    setStagedFilters(exploreFilters);
  }, [exploreFilters, setStagedFilters]);

  // Filter Pipeline (Filtered on exploreFilters, not staged)
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
    usedLocks.current.clear();
    fetchQuotes(1, true);
  }, [category]);

  useEffect(() => {
    if (page > 1) {
      fetchQuotes(page);
    }
  }, [page]);

  const isFilterActive = category !== 'all' || search !== '' || lengthFilter !== 'all' || sort !== 'random';

  const resetFilters = () => {
    // This is now in AppContext, but we can call it if needed. 
    // However, Explore.tsx might have been using it directly.
  };

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
    <div className="space-y-8">
      {/* Filters are now in the Global Header */}

      {/* Content Area */}
      {viewMode === 'grid' ? (
        <div className="flex flex-col gap-12 pb-[80px]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {loading && allQuotes.length === 0 ? (
                // Skeleton Grid
                Array.from({ length: 12 }).map((_, i) => (
                  <div key={`skeleton-${i}`} className="w-full h-[280px] md:h-[400px] shimmer-bg rounded-2xl" />
                ))
              ) : filteredQuotes.length > 0 ? (
                filteredQuotes.map((quote, index) => (
                  <motion.div
                    key={quote._id + index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layout
                  >
                    <QuoteCard 
                      quote={quote} 
                      image={images[quote._id]} 
                      category={quote.tags[0]}
                      className={cn(
                        "h-[280px] md:h-auto md:aspect-auto",
                        quote.content.length > 150 ? "md:aspect-[3/5]" : quote.content.length < 60 ? "md:aspect-square" : "md:aspect-[3/4]"
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
                        We couldn't find any quotes matching your current filters. Try adjusting your search or length.
                      </p>
                    </div>
                    <button 
                      onClick={resetFilters}
                      className="px-8 py-3 gradient-bg rounded-2xl font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                      Reset All Filters
                    </button>
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
        <div className="fixed inset-0 top-[170px] md:top-[160px] z-20 bg-dark-bg overflow-y-auto snap-y snap-mandatory no-scrollbar h-[calc(100dvh-170px)] md:h-[calc(100dvh-160px)]">
          {loading && allQuotes.length === 0 ? (
            <div className="h-full w-full shimmer-bg" />
          ) : filteredQuotes.map((quote, index) => (
            <div 
              key={quote._id + index}
              ref={index === filteredQuotes.length - 1 ? lastQuoteElementRef : null}
              className="h-[100dvh] snap-start"
            >
              <QuoteCard 
                quote={quote} 
                image={images[quote._id]} 
                category={quote.tags[0]}
                variant="reels"
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
    </div>
  );
};
