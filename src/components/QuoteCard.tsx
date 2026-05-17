import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Download, 
  Share2, 
  Quote as QuoteIcon, 
  Loader2, 
  MoreVertical, 
  X, 
  Maximize2, 
  Heart,
  Palette,
  Copy,
  MessageCircle,
  Twitter,
  Facebook,
  Instagram,
  Link2
} from 'lucide-react';
import html2canvas from 'html2canvas';

// Helper function to capture the quote card as a canvas
const captureQuoteCard = async (cardRef: React.RefObject<HTMLDivElement | null>) => {
  if (!cardRef.current) return null;
  const canvas = await html2canvas(cardRef.current, {
    useCORS: true,
    allowTaint: false,
    scale: 2,
    backgroundColor: null,
    width: cardRef.current.scrollWidth,
    height: cardRef.current.scrollHeight,
    windowWidth: cardRef.current.scrollWidth,
    windowHeight: cardRef.current.scrollHeight,
    logging: false,
    imageTimeout: 15000,
    ignoreElements: (el) => {
      // Ignore interactive elements or specific UI overlays during capture
      return el.classList.contains('z-10') || el.tagName === 'BUTTON' || el.classList.contains('z-20');
    }
  });
  return canvas;
};

// Helper function to calculate font size based on quote length
const getQuoteFontSize = (length: number) => {
  if (length < 60)  return "1.4rem";
  if (length < 100) return "1.2rem";
  if (length < 150) return "1rem";
  if (length < 200) return "0.88rem";
  if (length < 280) return "0.78rem";
  if (length < 380) return "0.68rem";
  return "0.58rem";
};

// Helper function to convert canvas to a blob for sharing
const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', 1.0);
  });
};

import { Quote, QuoteCategory } from '../types';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';

interface ShareModalProps {
  quote: Partial<Quote>;
  blob: Blob | null;
  thumbnail: string | null;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ quote, blob, thumbnail, onClose }) => {
  const { addToast } = useApp();
  const quoteText = `"${quote.content}" — ${quote.author}`;
  const encodedText = encodeURIComponent(quoteText);

  const shareOptions = [
    { 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      color: 'bg-[#25D366]', 
      platform: 'whatsapp' as const
    },
    { 
      name: 'Twitter / X', 
      icon: Twitter, 
      color: 'bg-black', 
      platform: 'twitter' as const
    },
    { 
      name: 'Facebook', 
      icon: Facebook, 
      color: 'bg-[#1877F2]', 
      platform: 'facebook' as const
    },
    { 
      name: 'Instagram', 
      icon: Instagram, 
      color: 'bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', 
      platform: 'instagram' as const
    },
    { 
      name: 'Save Image', 
      icon: Link2, 
      color: 'bg-gray-600', 
      platform: 'download_then_share' as const
    }
  ];

  const handleShareTo = async (option: typeof shareOptions[0]) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);

    if (option.platform === 'instagram' || option.platform === 'download_then_share') {
      const link = document.createElement('a');
      link.href = url;
      link.download = `SoulScript-${Date.now()}.png`;
      link.click();
      
      if (option.platform === 'instagram') {
        addToast('📋 Image saved! Now share it in Instagram.', 'success');
      } else {
        addToast('📥 Image saved! Now share it from your gallery.', 'success');
      }
      return;
    }

    const platformUrls = {
      whatsapp: `https://wa.me/?text=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`
    };

    // Download image + open platform
    const link = document.createElement('a');
    link.href = url;
    link.download = `SoulScript-${Date.now()}.png`;
    link.click();

    setTimeout(() => {
      window.open(platformUrls[option.platform] as string, '_blank', 'noopener,noreferrer');
    }, 800);

    addToast('📥 Image saved! Attach it when sharing.', 'info');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">Share SoulScript</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-[var(--text-secondary)]">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {thumbnail && (
            <div className="w-full flex justify-center p-2 bg-black/20 rounded-2xl">
              <img 
                src={thumbnail} 
                alt="Share Preview" 
                className="max-h-48 rounded-xl object-contain shadow-xl"
              />
            </div>
          )}

          <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">
            {shareOptions.map((option) => (
              <button
                key={option.name}
                onClick={() => handleShareTo(option)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div className={cn("p-2 rounded-xl text-white shadow-lg", option.color)}>
                  <option.icon size={18} />
                </div>
                <span className="font-bold text-[var(--text-primary)] text-sm">{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export interface QuoteCardProps {
  quote: Partial<Quote>;
  image?: string;
  category?: string;
  variant?: 'grid' | 'reels' | 'preview';
  className?: string;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  visibility?: {
    showQuote: boolean;
    showAuthor: boolean;
    showCategory: boolean;
    showQuoteMarks: boolean;
  };
}

export interface QuoteCardHandle {
  handleShare: (e?: React.MouseEvent) => Promise<void>;
  handleDownload: (e?: React.MouseEvent) => Promise<void>;
  sharing: boolean;
  downloading: boolean;
}

export const QuoteCard = forwardRef<QuoteCardHandle, QuoteCardProps>(({ 
  quote, 
  image, 
  category, 
  variant = 'grid',
  className,
  onSwipeUp,
  onSwipeDown,
  visibility = {
    showQuote: true,
    showAuthor: true,
    showCategory: true,
    showQuoteMarks: true
  }
}, ref) => {
  const { addToast, setActiveTab, setGeneratePreloadedQuote } = useApp();
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [shareThumbnail, setShareThumbnail] = useState<string | null>(null);
  
  const touchStart = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    handleShare: (e) => handleShare(e),
    handleDownload: (e) => handleDownload(e),
    sharing,
    downloading
  }), [sharing, downloading]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowMenu(false);
    if (!cardRef.current || downloading) return;
    
    setDownloading(true);
    try {
      const canvas = await captureQuoteCard(cardRef);
      if (!canvas) throw new Error('Capture failed');
      
      const link = document.createElement('a');
      link.download = `SoulScript-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      addToast('✅ Image saved!', 'success');
    } catch (err) {
      console.error('Download failed', err);
      addToast('❌ Download failed. Try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowMenu(false);
    if (sharing || !cardRef.current) return;

    setSharing(true);
    try {
      const canvas = await captureQuoteCard(cardRef);
      if (!canvas) throw new Error('Capture failed');
      
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error('Blob conversion failed');
      
      const file = new File([blob], 'SoulScript.png', { type: 'image/png' });
      const text = `"${quote.content}" — ${quote.author}`;

      // Try native share with image file
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'SoulScript',
            text: text
          });
          addToast('✅ Shared!', 'success');
          return;
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.warn('Native share failed, using fallback', err);
          } else {
            return; // User cancelled
          }
        }
      }
      
      // Fallback: Custom Share Modal with image ready
      setShareBlob(blob);
      setShareThumbnail(canvas.toDataURL('image/png'));
      setShowShareModal(true);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share process failed', err);
        addToast('❌ Share failed. Try saving locally.', 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowMenu(false);
    const text = `"${quote.content}"${quote.author ? ` — ${quote.author}` : ''}`;
    navigator.clipboard.writeText(text);
    addToast('✅ Copied to clipboard!', 'success');
  };

  const handleEditInGenerate = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowMenu(false);
    
    setGeneratePreloadedQuote({
      content: quote.content || "",
      author: quote.author || "",
      category: (category as QuoteCategory) || 'motivational',
      imageUrl: image || ""
    });
    
    setActiveTab('generate');
  };

  const isReels = variant === 'reels';
  const isPreview = variant === 'preview';

  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef<number>(0);

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isReels) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
      addToast('Saved to your favorites!', 'success');
    }
    lastTap.current = now;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isReels) return;
    touchStart.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isReels || touchStart.current === null) return;
    handleDoubleTap(e);
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart.current - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) onSwipeUp?.();
      else onSwipeDown?.();
    }
    touchStart.current = null;
  };

  return (
    <div 
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleDoubleTap}
      className={cn(
        "relative overflow-hidden group rounded-2xl shadow-2xl bg-black transition-all cursor-pointer",
        isReels ? "h-full w-full rounded-none" : "w-full min-h-[280px] h-auto",
        isPreview && "aspect-square",
        className
      )}
    >
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="p-8 rounded-full bg-white/10 backdrop-blur-md">
              <Heart size={80} className="text-red-500 fill-red-500 drop-shadow-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background Image / Placeholder */}
      <div className="absolute inset-0 bg-black">
        {image && (
          <img 
            src={image} 
            alt="Quote background" 
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const seed = quote._id?.replace(/[^a-zA-Z0-9]/g, '') || Math.floor(Math.random() * 1000).toString();
              if (!target.src.includes('picsum.photos')) {
                target.src = `https://picsum.photos/seed/${seed}/1920/1080`;
              }
            }}
            className={cn(
              "absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000",
              imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-110"
            )}
            crossOrigin="anonymous"
          />
        )}
        
        {/* Shimmer while image loads */}
        {!imageLoaded && image && (
          <div className="absolute inset-0 shimmer-bg" />
        )}
        
        {!image && (
          <div className="absolute inset-0 gradient-bg opacity-30 animate-pulse" />
        )}
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/75 transition-opacity" />

      {/* 3-Dot Menu Button */}
      <div className="absolute top-4 right-4 z-10" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-2 bg-black/50 backdrop-blur-md border border-white/20 rounded-full text-white shadow-lg hover:bg-black/70 transition-all active:scale-95"
          title="Actions"
        >
          {showMenu ? <X size={20} /> : <MoreVertical size={20} />}
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 mt-2 w-48 bg-[var(--dropdown-bg)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-20"
          >
            <button
              onClick={handleEditInGenerate}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-indigo-500/10 transition-colors border-b border-[var(--border-color)]"
            >
              <Palette size={16} className="text-pink-400" />
              Edit in Generate
            </button>
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-indigo-500/10 transition-colors border-b border-[var(--border-color)]"
            >
              <Copy size={16} className="text-indigo-400" />
              Copy Quote
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-indigo-500/10 transition-colors border-b border-[var(--border-color)]"
            >
              {sharing ? <Loader2 size={16} className="text-purple-400 animate-spin" /> : <Share2 size={16} className="text-purple-400" />}
              {sharing ? 'Sharing...' : 'Share'}
            </button>
            <button
              onClick={() => handleDownload()}
              disabled={downloading}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:bg-indigo-500/10 transition-colors"
            >
              <Download size={16} className="text-emerald-400" />
              {downloading ? 'Saving...' : 'Download'}
            </button>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className={cn(
        "relative flex flex-col p-6 min-h-[280px]",
        isReels ? "h-full items-center text-center justify-center max-w-3xl mx-auto" : "justify-start gap-4"
      )}>
        <div className={cn(
          "relative flex flex-col",
          isReels ? "w-full overflow-hidden flex-1 justify-center" : ""
        )}>
          {visibility.showQuote && (
            <div className={cn(
              "font-serif font-bold text-white tracking-tight transition-all drop-shadow-md",
              (isReels || isPreview) && "h-full overflow-y-auto custom-scrollbar px-2 flex flex-col justify-center"
            )}
            style={{ 
              fontSize: getQuoteFontSize(quote.content?.length || 0), 
              lineHeight: '1.45' 
            }}
            >
              <p className="m-0 break-words">
                "{quote.content}"
              </p>
            </div>
          )}
        </div>

        <div className={cn(
          "flex flex-col gap-2 shrink-0",
          !isReels && "mt-auto",
          isReels && "items-center mt-8"
        )}>
          {!isReels && <div className="h-[2px] w-9 bg-gradient-to-r from-purple-600 to-pink-600 mb-2" />}
          {visibility.showAuthor && quote.author && (
            <cite className="text-white text-sm md:text-base font-bold not-italic drop-shadow-sm">
              {quote.author}
            </cite>
          )}
          {visibility.showCategory && category && (
            <span className="text-[10px] uppercase tracking-[1.5px] text-white/60 font-medium drop-shadow-sm">
              {category}
            </span>
          )}
        </div>
      </div>

      {/* Share Modal Fallback */}
      <AnimatePresence>
        {showShareModal && (
          <ShareModal 
            quote={quote} 
            blob={shareBlob}
            thumbnail={shareThumbnail}
            onClose={() => setShowShareModal(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
});
