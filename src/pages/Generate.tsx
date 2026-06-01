import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  PenLine, 
  Sparkles, 
  Download, 
  Share2, 
  Check,
  Zap,
  Globe,
  Loader2,
  Copy,
  Type,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { QuoteCard, QuoteCardHandle } from '../components/QuoteCard';
import { QuoteCategory, Quote } from '../types';
import { CATEGORIES, FALLBACK_QUOTES } from '../constants';
import { cn, copyToClipboard } from '../lib/utils';

const FONTS = [
  { id: 'playfair', name: 'Playfair Display', family: '"Playfair Display", serif', premium: false },
  { id: 'lora', name: 'Lora', family: '"Lora", serif', premium: true },
  { id: 'merriweather', name: 'Merriweather', family: '"Merriweather", serif', premium: true },
  { id: 'cormorant', name: 'Cormorant Garamond', family: '"Cormorant Garamond", serif', premium: true },
  { id: 'dm-serif', name: 'DM Serif Display', family: '"DM Serif Display", serif', premium: true },
  { id: 'libre', name: 'Libre Baskerville', family: '"Libre Baskerville", serif', premium: true },
  { id: 'crimson', name: 'Crimson Text', family: '"Crimson Text", serif', premium: true },
  { id: 'raleway', name: 'Raleway', family: '"Raleway", sans-serif', premium: true },
];

export const Generate: React.FC = () => {
  const { addToast, generatePreloadedQuote, setGeneratePreloadedQuote } = useApp();
  const { isPremium, setGatingType } = useAuth();
  
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
  
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [copying, setCopying] = useState(false);
  const isPreloadingRef = useRef(false);
  const quoteCardRef = useRef<QuoteCardHandle>(null);

  useEffect(() => {
    if (generatePreloadedQuote) {
      isPreloadingRef.current = true;
      setCategory(generatePreloadedQuote.category);
      setSource('api');
      setApiQuote({
        content: generatePreloadedQuote.content,
        author: generatePreloadedQuote.author,
        tags: [generatePreloadedQuote.category]
      });
      
      setGeneratePreloadedQuote(null);
      addToast('Loaded your quote for editing!', 'success');
      
      setTimeout(() => {
        isPreloadingRef.current = false;
      }, 500);
    }
  }, [generatePreloadedQuote, setGeneratePreloadedQuote, addToast]);

  const usedQuoteIdsRef = React.useRef<Record<string, Set<string>>>({});

  const [cardVisibility, setCardVisibility] = useState({
    showQuote: true,
    showAuthor: true,
    showQuoteMarks: true
  });

  const toggleVisibility = (key: keyof typeof cardVisibility) => {
    setCardVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const displayQuote = source === 'api' ? apiQuote : userQuote;

  const fetchRandomQuote = async (targetCategory: QuoteCategory = category) => {
    if (isPreloadingRef.current) return;
    setLoadingQuote(true);
    
    if (!usedQuoteIdsRef.current[targetCategory]) {
      usedQuoteIdsRef.current[targetCategory] = new Set();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch('https://dummyjson.com/quotes/random', { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      setApiQuote({
        content: data.quote,
        author: data.author,
        _id: String(data.id),
        tags: [targetCategory]
      });
    } catch (error) {
      const fallbacks = FALLBACK_QUOTES[targetCategory] || FALLBACK_QUOTES.motivational;
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      setApiQuote(randomFallback);
      addToast('Using offline database (Network Slow)', 'info');
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    if (isPreloadingRef.current) return;
    
    if (source === 'api') {
      fetchRandomQuote(category);
    } else {
      setUserQuote(prev => ({ ...prev, content: "" }));
    }
  }, [category]);

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
    const success = await copyToClipboard(text);
    if (success) {
      setCopying(true);
      addToast('✅ Copied text to clipboard!', 'success');
      setTimeout(() => setCopying(false), 2000);
    } else {
      addToast('❌ Copy failed.', 'error');
    }
  };

  const handleRegenerate = async () => {
    if (source === 'api') {
      await fetchRandomQuote(category);
    } else {
      addToast('Enter your custom quote text directly below!', 'info');
    }
  };

  return (
    <>
      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start -mx-4 lg:mx-0 min-h-screen pb-32 transition-all">
      {/* Top Preview Section (ORDER 1 on Mobile, 2 on Desktop) */}
      <div className="w-full lg:col-span-7 bg-[var(--bg-primary)] px-4 pb-4 lg:p-6 transition-all duration-300 shrink-0 order-1 lg:order-2">
        <div className="hidden lg:flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Zap className="text-yellow-400" size={20} />
            </div>
            <h3 className="text-lg font-bold uppercase tracking-widest text-[var(--text-primary)]">Master Preview</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopyText}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--bg-card)] hover:bg-white/10 border border-[var(--border-color)] rounded-full text-xs font-bold uppercase tracking-widest transition-all active:scale-95 text-[var(--text-primary)] cursor-pointer"
            >
              {copying ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              {copying ? 'Copied' : 'Copy Text'}
            </button>
          </div>
        </div>

        <div className="h-auto w-full max-w-lg mx-auto flex flex-col gap-5 pt-4 lg:pt-0">
           <div className="relative aspect-square w-full group">
              <div className="h-full w-full">
                <QuoteCard 
                  ref={quoteCardRef}
                  quote={displayQuote} 
                  category={category}
                  variant="preview"
                  visibility={{
                    showQuote: cardVisibility.showQuote,
                    showAuthor: cardVisibility.showAuthor,
                    showCategory: false,
                    showQuoteMarks: cardVisibility.showQuoteMarks
                  }}
                  font={selectedFont.family}
                  className="h-full w-full ring-1 ring-white/10"
                />
              </div>
              
              <AnimatePresence>
                {loadingQuote && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30 rounded-none"
                  >
                    <div className="p-3 bg-indigo-600/10 rounded-full border border-indigo-500/20">
                      <Loader2 className="animate-spin text-indigo-400" size={24} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white/80 animate-pulse">
                      Generating...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
           
           {/* Quick Action Buttons */}
           <div className="flex gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
             {source === 'api' ? (
                <button 
                  onClick={() => fetchRandomQuote()}
                  disabled={loadingQuote}
                  className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-black uppercase tracking-wider hover:border-indigo-500/50 transition-all active:scale-95 disabled:opacity-50 px-2 cursor-pointer"
                >
                  {loadingQuote ? <Loader2 size={14} className="animate-spin shrink-0" /> : <span>🔄 Roll New Quote</span>}
                </button>
             ) : (
                <div className="w-full text-center py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  ✍️ Editing Custom Quote Card
                </div>
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
                 { id: 'showQuoteMarks', label: 'Show Quote Marks ❝' },
               ].map((item) => (
                 <div 
                   key={item.id}
                   className="flex justify-between items-center py-2.5 border-b border-[var(--border-color)] last:border-0"
                 >
                   <span className="text-[var(--text-primary)] text-sm font-medium">{item.label}</span>
                   <button
                     onClick={() => toggleVisibility(item.id as keyof typeof cardVisibility)}
                     className={cn(
                       "relative w-11 h-6 rounded-full transition-colors duration-200 outline-hidden shrink-0 cursor-pointer block",
                       cardVisibility[item.id as keyof typeof cardVisibility] 
                         ? "bg-indigo-600" 
                         : "bg-white/15"
                     )}
                   >
                     <motion.div 
                       animate={{ x: cardVisibility[item.id as keyof typeof cardVisibility] ? 20 : 0 }}
                       transition={{ type: "spring", stiffness: 500, damping: 30 }}
                       initial={false}
                       className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-xs pointer-events-none"
                     />
                   </button>
                 </div>
               ))}
             </div>

              {/* Font Picker */}
              <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
                <div className="flex items-center gap-2">
                  <Type size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)]">Serif Variant</span>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar -mx-2 px-2 no-scrollbar">
                  {FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => {
                        if (font.premium && !isPremium) {
                          setGatingType('premium_feature');
                        } else {
                          setSelectedFont(font);
                        }
                      }}
                      style={{ fontFamily: font.family }}
                      className={cn(
                        "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border shrink-0 flex items-center gap-2 cursor-pointer",
                        selectedFont.id === font.id 
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" 
                          : "bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10"
                      )}
                    >
                      {font.name}
                      {font.premium && !isPremium && <Lock size={12} className="opacity-50" />}
                    </button>
                  ))}
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Controls Section (ORDER 2 on Mobile, 1 on Desktop) */}
      <div className="w-full lg:col-span-5 px-4 pt-8 lg:p-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 h-auto pb-4 order-2 lg:order-1">

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
                  <label className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Author Name</label>
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
          {source === 'api' && (
            <button
              onClick={handleRegenerate}
              disabled={loadingQuote}
              className="w-full py-5 gradient-bg rounded-2xl font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/30 flex items-center justify-center gap-4 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale text-white"
            >
              {loadingQuote ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <RefreshCw size={24} />
                  Regenerate
                </>
              )}
            </button>
          )}

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
    </>
  );
};
