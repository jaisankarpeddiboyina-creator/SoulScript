import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  PenLine, 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Share2, 
  Check,
  Zap,
  Globe,
  Loader2,
  Copy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QuoteCard, QuoteCardHandle } from '../components/QuoteCard';
import { QuoteCategory, Quote } from '../types';
import { CATEGORIES, CATEGORY_MAP, FALLBACK_QUOTES } from '../constants';
import { cn } from '../lib/utils';

const categoryImageKeywords: Record<string, string[]> = {
  love:         ["couple,sunset", "romance,flowers", "love,beach", "heart,nature", "together,warm", "kiss,golden"],
  motivational: ["success,mountain", "winner,light", "ambition,city", "hustle,sunrise", "goal,peak", "achievement,sky"],
  wisdom:       ["ancient,forest", "meditation,nature", "philosophy,ocean", "old,library", "zen,mountain", "sage,mist"],
  humor:        ["laugh,colorful", "fun,bright", "joy,playful", "smile,sunshine", "happy,vibrant", "comedy,light"],
  life:         ["journey,road", "lifestyle,morning", "freedom,open", "living,nature", "adventure,path", "balance,calm"],
  inspiration:  ["sunrise,sky", "light,horizon", "spark,golden", "dream,clouds", "hope,dawn", "rise,beautiful"],
  philosophy:   ["cosmos,dark", "abstract,mind", "shadow,depth", "universe,stars", "thought,dramatic", "exist,moody"],
  friendship:   ["friends,together", "bond,laugh", "group,warm", "unity,people", "companionship,happy", "trust,smile"]
};

export const Generate: React.FC = () => {
  const { addToast, generatePreloadedQuote, setGeneratePreloadedQuote } = useApp();
  
  const [category, setCategory] = useState<QuoteCategory>('motivational');
  const [source, setSource] = useState<'api' | 'custom'>('api');
  
  const [apiQuote, setApiQuote] = useState<Partial<Quote>>({
    content: "The best way to predict the future is to create it.",
    author: "Peter Drucker"
  });
  const [userQuote, setUserQuote] = useState<Partial<Quote>>({
    content: "",
    author: ""
  });
  const [imageUrl, setImageUrl] = useState('');
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [copying, setCopying] = useState(false);
  const isPreloadingRef = useRef(false);
  const quoteCardRef = useRef<QuoteCardHandle>(null);

  useEffect(() => {
    if (generatePreloadedQuote) {
      isPreloadingRef.current = true;
      if (generatePreloadedQuote.imageUrl) {
        setImageUrl(generatePreloadedQuote.imageUrl);
      }
      
      setCategory(generatePreloadedQuote.category);
      setSource('api');
      setApiQuote({
        content: generatePreloadedQuote.content,
        author: generatePreloadedQuote.author,
        tags: [generatePreloadedQuote.category]
      });
      
      setGeneratePreloadedQuote(null);
      addToast('Loaded your quote for editing!', 'success');
      
      // Delay resetting the preloading flag to let the category effect run once and be blocked
      setTimeout(() => {
        isPreloadingRef.current = false;
      }, 500);
    }
  }, [generatePreloadedQuote, setGeneratePreloadedQuote, addToast]);

  const imageIndexRef = React.useRef<Record<string, number>>({});
  const usedQuoteIdsRef = React.useRef<Record<string, Set<string>>>({});
  const hasMountedRef = useRef(false);

  const [cardVisibility, setCardVisibility] = useState({
    showQuote: true,
    showAuthor: true,
    showCategory: true,
    showQuoteMarks: true
  });

  const toggleVisibility = (key: keyof typeof cardVisibility) => {
    setCardVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const displayQuote = source === 'api' ? apiQuote : userQuote;

  const fetchRandomQuote = async (targetCategory: QuoteCategory = category) => {
    if (isPreloadingRef.current) return;
    setLoadingQuote(true);
    
    // Track used quote IDs to never repeat
    if (!usedQuoteIdsRef.current[targetCategory]) {
      usedQuoteIdsRef.current[targetCategory] = new Set();
    }
    const usedIds = usedQuoteIdsRef.current[targetCategory];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // Primary: Quotable API - Fetch a small batch to filter out used ones
      const response = await fetch(`/api/quotes/random?tags=${targetCategory}&limit=5`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      // Data is an array for /quotes/random with limit
      const quotesArray = Array.isArray(data) ? data : [data];
      
      // Find one not used yet
      const unused = quotesArray.find(q => !usedIds.has(q._id));
      const selected = unused || quotesArray[0];

      if (selected) {
        usedIds.add(selected._id);
        setApiQuote({
          content: selected.content,
          author: selected.author,
          _id: selected._id,
          tags: selected.tags
        });
      }
    } catch (error) {
      // Secondary: Try DummyJSON if Quotable is down
      try {
        const fallbackRes = await fetch('/api/fallback-quotes');
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          setApiQuote({
            content: data.quote,
            author: data.author
          });
          addToast('Connected to secondary database', 'info');
          return;
        }
      } catch (innerError) {
        // Silent
      }

      // Final Fallback: Offline constants
      const fallbacks = FALLBACK_QUOTES[targetCategory] || FALLBACK_QUOTES.motivational;
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setApiQuote(randomFallback);
      addToast('Using offline database (Network Slow)', 'info');
    } finally {
      setLoadingQuote(false);
    }
  };

  const fetchNewImage = async (targetCategory: QuoteCategory = category) => {
    if (isPreloadingRef.current) return;
    setLoadingImage(true);
    
    // Rotating pool logic
    const pool = categoryImageKeywords[targetCategory] || categoryImageKeywords.motivational;
    const currentIndex = imageIndexRef.current[targetCategory] || 0;
    const keyword = pool[currentIndex % pool.length];
    imageIndexRef.current[targetCategory] = currentIndex + 1;

    const isMobile = window.innerWidth < 768;
    const seed = Date.now() + Math.floor(Math.random() * 99999);
    
    const url = `https://loremflickr.com/${isMobile ? "800/1000" : "1920/1080"}/${encodeURIComponent(keyword)}?lock=${seed}&cors=1`;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      setImageUrl(url);
      setLoadingImage(false);
    };
    img.onerror = () => {
      setImageUrl(`https://picsum.photos/seed/${seed}/${isMobile ? "800/1000" : "1920/1080"}`);
      setLoadingImage(false);
    };
  };

  useEffect(() => {
    // When category changes — reset indexes and fetch fresh
    if (isPreloadingRef.current) return;
    
    imageIndexRef.current[category] = 0;
    
    if (source === 'api') {
      fetchRandomQuote(category);
    } else {
      setUserQuote(prev => ({ ...prev, content: "" }));
    }
    fetchNewImage(category);
  }, [category]);

  useEffect(() => {
    if (source === 'custom') {
      // We don't fetch new quote but we keep image sync if needed
    }
  }, [source]);

  const handleShare = async () => {
    if (quoteCardRef.current) {
      await quoteCardRef.current.handleShare();
    }
  };

  const handleDownload = async () => {
    if (quoteCardRef.current) {
      await quoteCardRef.current.handleDownload();
    }
  };

  const handleCopyText = async () => {
    const text = `"${displayQuote.content}"${displayQuote.author ? ` — ${displayQuote.author}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopying(true);
      addToast('✅ Copied to clipboard!', 'success');
      setTimeout(() => setCopying(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleRegenerate = async () => {
    const promises = [fetchNewImage(category)];
    if (source === 'api') promises.push(fetchRandomQuote(category));
    await Promise.all(promises);
  };

  const isLoading = loadingQuote || loadingImage;

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // If height decreases significantly, assume keyboard is up
        setIsKeyboardVisible(window.innerHeight < 600);
      } else {
        setIsKeyboardVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="md:grid md:grid-cols-2 lg:grid-cols-12 md:gap-8 items-start -mx-4 md:mx-auto min-h-[100dvh] pb-[80px] flex flex-col overflow-y-auto">
      {/* Top Preview Section - Fixed on Mobile (ORDER 2 on Desktop) */}
      <div className={cn(
        "w-full md:grid md:col-span-1 lg:col-span-12 xl:col-span-7 sticky top-[84px] md:top-24 z-20 space-y-4 md:space-y-6 bg-[var(--bg-primary)] md:bg-transparent px-4 pb-4 md:p-0 transition-all duration-300 shrink-0 md:order-2",
        "h-auto"
      )}>
        <div className="hidden md:flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Zap className="text-yellow-400" size={20} />
            </div>
            <h3 className="text-lg font-bold uppercase tracking-widest text-[var(--text-primary)]">Master Preview</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopyText}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-card)] hover:bg-white/10 border border-[var(--border-color)] rounded-full text-xs font-bold uppercase tracking-widest transition-all active:scale-95 text-[var(--text-primary)]"
            >
              {copying ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copying ? 'Copied' : 'Copy Text'}
            </button>
          </div>
        </div>

        <div className="h-auto w-full max-w-md mx-auto flex flex-col gap-4 pt-4 md:pt-0">
           <div className="relative h-[clamp(280px,45dvh,480px)] group overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full shimmer-bg rounded-2xl shadow-2xl ring-1 ring-[var(--border-color)]" 
                  />
                ) : (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ type: "spring", damping: 20, stiffness: 150 }}
                    className="h-full w-full"
                  >
                    <QuoteCard 
                      ref={quoteCardRef}
                      quote={displayQuote} 
                      image={imageUrl} 
                      category={category}
                      variant="preview"
                      visibility={cardVisibility}
                      className="h-full shadow-2xl ring-1 ring-white/10"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
           
           {/* Quick Action Buttons - Moved OUTSIDE and BELOW the card */}
           <div className="flex gap-2.5 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
             <button 
               onClick={() => fetchNewImage()}
               disabled={loadingImage}
               className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest hover:border-indigo-500/50 transition-all active:scale-95 disabled:opacity-50"
             >
               {loadingImage ? <Loader2 size={16} className="animate-spin" /> : "🖼️ Change Image"}
             </button>

             {source === 'api' && (
               <button 
                 onClick={() => fetchRandomQuote()}
                 disabled={loadingQuote}
                 className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest hover:border-indigo-500/50 transition-all active:scale-95 disabled:opacity-50"
               >
                 {loadingQuote ? <Loader2 size={16} className="animate-spin" /> : "🔄 Change Quote"}
               </button>
             )}
           </div>

           {/* Customize Card Toggles */}
           <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-1.5 bg-pink-500/10 rounded-lg">
                 <Sparkles className="text-pink-400" size={16} />
               </div>
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Customize Card</h3>
             </div>
             
             <div className="space-y-1">
               {[
                 { id: 'showQuote', label: 'Show Quote Text' },
                 { id: 'showAuthor', label: 'Show Author Name' },
                 { id: 'showCategory', label: 'Show Category Tag' },
                 { id: 'showQuoteMarks', label: 'Show Quote Marks ❝❞' },
               ].map((item) => (
                 <div 
                   key={item.id}
                   className="flex justify-between items-center py-2.5 border-b border-[var(--border-color)] last:border-0"
                 >
                   <span className="text-[var(--text-primary)] text-sm font-medium">{item.label}</span>
                   <button
                     onClick={() => toggleVisibility(item.id as keyof typeof cardVisibility)}
                     className={cn(
                       "relative w-11 h-6 rounded-full transition-colors duration-200 outline-hidden",
                       cardVisibility[item.id as keyof typeof cardVisibility] 
                         ? "bg-linear-to-br from-purple-600 to-pink-600" 
                         : "bg-white/15"
                     )}
                   >
                     <motion.div 
                       animate={{ x: cardVisibility[item.id as keyof typeof cardVisibility] ? 22 : 2 }}
                       initial={false}
                       className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                     />
                   </button>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Controls Section - Scrollable (ORDER 1 on Desktop) */}
      <div className="w-full md:grid md:col-span-1 lg:col-span-12 xl:col-span-5 px-4 pt-8 md:p-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 h-auto md:h-auto pb-4 md:pb-12 md:order-1">

        <section className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Globe className="text-indigo-400" size={20} />
            </div>
            <h3 className="text-lg font-bold uppercase tracking-widest text-[var(--text-secondary)]">Category</h3>
          </div>
          
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as QuoteCategory)}
              className="w-full h-14 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] text-sm font-bold px-5 appearance-none cursor-pointer outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase tracking-widest"
            >
              {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-dark-card text-white">
                  {cat.label}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
              <RefreshCw size={16} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <PenLine className="text-indigo-400" size={20} />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-widest text-[var(--text-secondary)]">Source</h3>
            </div>
            <div className="flex bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-color)] w-full max-w-[200px] ml-4 text-[var(--text-primary)]">
              <button
                onClick={() => setSource('api')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-all uppercase tracking-widest",
                  source === 'api' ? "bg-indigo-600 text-white shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                Auto
              </button>
              <button
                onClick={() => setSource('custom')}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-xl transition-all uppercase tracking-widest",
                  source === 'custom' ? "bg-indigo-600 text-white shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                Custom
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {source === 'custom' ? (
              <motion.div 
                key="custom-source"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Write your quote</label>
                  <div className="relative">
                    <textarea
                      value={userQuote.content}
                      onChange={(e) => {
                        setUserQuote(prev => ({ ...prev, content: e.target.value }));
                      }}
                      placeholder="Type your inspiring quote here..."
                      className="w-full h-32 px-5 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-hidden focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none text-lg font-serif text-[var(--text-primary)]"
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] font-black uppercase text-[var(--text-secondary)]">
                      {userQuote.content?.length || 0} chars
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Your name or leave blank</label>
                  <input
                    type="text"
                    value={userQuote.author}
                    onChange={(e) => {
                      setUserQuote(prev => ({ ...prev, author: e.target.value }));
                    }}
                    placeholder="Author name (optional)"
                    className="w-full px-5 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl outline-hidden focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-[var(--text-primary)]"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="api-source"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-6"
              >
                <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] border-dashed text-center group hover:bg-white/[0.07] transition-colors">
                  <Sparkles className="mx-auto mb-3 text-indigo-400/50 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500" size={32} />
                  <p className="text-[var(--text-secondary)] font-medium leading-relaxed text-sm">
                    We'll hand-pick a perfect quote from our database based on your selected category.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">API Selected Author</label>
                  <input
                    type="text"
                    value={apiQuote.author}
                    readOnly
                    className="w-full px-5 py-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl text-[var(--text-secondary)] cursor-not-allowed font-medium"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="flex flex-col gap-4 pt-4 pb-12">
          <button
            onClick={handleRegenerate}
            disabled={isLoading}
            className="w-full py-5 gradient-bg rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale text-white"
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <RefreshCw size={24} />
                Regenerate
              </>
            )}
          </button>

          <div className="flex gap-4">
             <button 
              onClick={handleShare}
              disabled={quoteCardRef.current?.sharing}
              className="flex-1 py-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all text-xs text-[var(--text-primary)] disabled:opacity-50"
             >
               {quoteCardRef.current?.sharing ? <Loader2 size={20} className="animate-spin text-purple-400" /> : <Share2 size={20} className="text-purple-400" />}
               {quoteCardRef.current?.sharing ? 'Sharing...' : 'Share'}
             </button>
             <button 
              onClick={handleCopyText}
              className="flex-1 py-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all text-xs text-[var(--text-primary)]"
             >
               <Copy size={20} className="text-indigo-400" />
               Copy Text
             </button>
             <button 
              onClick={handleDownload}
              disabled={quoteCardRef.current?.downloading}
              className="flex-1 py-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all text-xs text-[var(--text-primary)] disabled:opacity-50"
             >
               {quoteCardRef.current?.downloading ? <Loader2 size={20} className="animate-spin text-emerald-400" /> : <Download size={20} className="text-emerald-400" />}
               {quoteCardRef.current?.downloading ? 'Saving...' : 'Save'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
