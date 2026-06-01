import React, { useRef, useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Download, 
  Share2, 
  Loader2, 
  MoreVertical, 
  X, 
  Palette,
  Copy,
  Library,
  Eye,
  EyeOff,
  Check,
  MessageCircle,
  Twitter,
  Facebook,
  Instagram,
  Link2
} from 'lucide-react';
import { Quote, QuoteCategory } from '../types';
import { cn, copyToClipboard } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// 1. Precise High-Resolution 2D Canvas Renderer for 9:16 premium exports (1080 x 1920)
// This completely bypasses slow & buggy DOM cloning and delivers 100% reliable, high-speed exports.
export const drawQuoteCardCanvas = async (
  content: string, 
  author?: string, 
  fontName?: string
): Promise<HTMLCanvasElement | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Render pristine, smooth gradient background (deep purple to dark plum)
  const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
  gradient.addColorStop(0, '#160824'); // Deep elegant purple
  gradient.addColorStop(1, '#340B2D'); // Rich dark plum
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // TOP CENTER: Small gold quotation mark symbol (❝) at 5% of height (around 320px)
  ctx.fillStyle = '#FFD700'; // Gold color
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'normal 96px "Georgia", "Cormorant Garamond", serif';
  ctx.fillText('❝', 540, 320);

  // MIDDLE: Elegant serif font in white, italic style
  const cleanQuote = content.replace(/^["'“'‟]+|["'”'‟]+$/g, '').trim();
  const words = cleanQuote.split(' ');
  const maxLineWidth = 900; // 90px on left/right margins for safety zone
  let lines: string[] = [];
  let fontSize = 90; // Starting font size for compact quotes

  // Iterative word wrapper solver to dynamically fit any quote into up to 4 lines maximum
  const cleanedFont = fontName ? fontName.replace(/['"“”]+/g, '').split(',')[0].trim() : 'Georgia';
  const activeFont = cleanedFont || 'Georgia';

  while (fontSize >= 40) {
    ctx.font = `italic 500 ${fontSize}px "${activeFont}", Georgia, "Playfair Display", serif`;
    lines = [];
    let currentLine = '';
    
    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + ' ';
      const metrics = ctx.measureText(testLine.trim());
      if (metrics.width > maxLineWidth && n > 0) {
        lines.push(currentLine.trim());
        currentLine = words[n] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());

    if (lines.length <= 4) {
      break;
    }
    fontSize -= 4; // Decrement font size dynamically if it overflows
  }

  // Fallback truncation if a quote is extremely massive
  if (lines.length > 4) {
    lines.length = 4;
    lines[3] = lines[3].replace(/[\s,.;:!?]+$/, "") + "...";
  }

  // Draw white text in italics with high contrast soft shadows
  const lineHeight = fontSize * 1.5;
  const textHeight = lines.length * lineHeight;
  const startOfQuoteY = 880 - (textHeight / 2); // Perfectly centered in middle-upper area

  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = `italic 500 ${fontSize}px "${activeFont}", Georgia, "Playfair Display", serif`;

  for (let i = 0; i < lines.length; i++) {
    const lineY = startOfQuoteY + (i * lineHeight);
    ctx.fillText(lines[i], 540, lineY);
  }

  // Reset shadow for details below
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // BELOW QUOTE: Thin short gold horizontal line centered
  const accentLineY = startOfQuoteY + textHeight + 70;
  ctx.strokeStyle = '#FFD700'; // Gold Color
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(490, accentLineY);
  ctx.lineTo(590, accentLineY);
  ctx.stroke();

  // BELOW LINE: Author name in small gold capital letters
  if (author) {
    const authorY = accentLineY + 65;
    ctx.font = 'normal bold 32px "Inter", "Space Grotesk", sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(author.toUpperCase().trim(), 540, authorY);
  }

  // BOTTOM: Very small white logo "SOULSCRIPT" at 40% opacity (80px from bottom)
  ctx.font = 'normal 600 22px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('SOULSCRIPT', 540, 1840);

  return canvas;
};

// Convert canvas to a blob for native sharing APIs
const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', 1.0);
  });
};

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
      color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', 
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
    if (!blob) {
      if (option.platform === 'instagram') {
        addToast('📋 Opening Instagram...', 'info');
        window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
        onClose();
        return;
      }
      if (option.platform === 'download_then_share') {
        addToast('⚠️ Saving images is restricted in this sandboxed preview. Try Copying Text!', 'warning');
        return;
      }
      const platformUrls = {
        whatsapp: `https://wa.me/?text=${encodedText}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`
      };
      window.open(platformUrls[option.platform] as string, '_blank', 'noopener,noreferrer');
      onClose();
      return;
    }
    const url = URL.createObjectURL(blob);

    if (option.platform === 'instagram') {
      const link = document.createElement('a');
      link.href = url;
      link.download = `SoulScript-${Date.now()}.png`;
      link.click();
      
      addToast('📋 Image saved! Opening Instagram...', 'success');
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      onClose();
      return;
    }

    if (option.platform === 'download_then_share') {
      const link = document.createElement('a');
      link.href = url;
      link.download = `SoulScript-${Date.now()}.png`;
      link.click();
      
      addToast('📥 Image saved! Now share it from your gallery.', 'success');
      onClose();
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

    window.open(platformUrls[option.platform] as string, '_blank', 'noopener,noreferrer');

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
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  customMenuOptions?: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[];
  visibility?: {
    showQuote: boolean;
    showAuthor: boolean;
    showCategory: boolean;
    showQuoteMarks: boolean;
  };
  font?: string;
  onMenuOpenChange?: (open: boolean) => void;
}

export interface QuoteCardHandle {
  handleShare: (e?: React.MouseEvent) => Promise<void>;
  handleDownload: (e?: React.MouseEvent) => Promise<void>;
  getCanvas: () => Promise<HTMLCanvasElement | null>;
  sharing: boolean;
  downloading: boolean;
}

export const QuoteCard = forwardRef<QuoteCardHandle, QuoteCardProps>(({ 
  quote, 
  variant = 'grid',
  className,
  onSwipeUp,
  onSwipeDown,
  selectionMode,
  isSelected,
  onToggleSelect,
  customMenuOptions,
  visibility = {
    showQuote: true,
    showAuthor: true,
    showCategory: false,
    showQuoteMarks: true
  },
  font = 'Playfair Display',
  onMenuOpenChange
}, ref) => {
  const { addToast, setActiveTab, setGeneratePreloadedQuote, setPlaylistModalQuote } = useApp();
  const { incrementDownload } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [shareThumbnail, setShareThumbnail] = useState<string | null>(null);
  
  // Local visibility settings per quote
  const [localVisibility, setLocalVisibility] = useState({
    showQuote: visibility.showQuote !== undefined ? visibility.showQuote : true,
    showAuthor: visibility.showAuthor !== undefined ? visibility.showAuthor : true,
    showCategory: visibility.showCategory !== undefined ? visibility.showCategory : false,
    showQuoteMarks: visibility.showQuoteMarks !== undefined ? visibility.showQuoteMarks : true,
  });
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    if (quote._id) {
      const saved = localStorage.getItem(`visibility_${quote._id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLocalVisibility(prev => ({ ...prev, ...parsed }));
          return;
        } catch (e) {
          console.error('Failed to parse visibility', e);
        }
      }
    }

    setLocalVisibility({
      showQuote: visibility.showQuote !== undefined ? visibility.showQuote : true,
      showAuthor: visibility.showAuthor !== undefined ? visibility.showAuthor : true,
      showCategory: visibility.showCategory !== undefined ? visibility.showCategory : false,
      showQuoteMarks: visibility.showQuoteMarks !== undefined ? visibility.showQuoteMarks : true
    });
  }, [quote._id, visibility]);

  const toggleVisibility = (key: keyof typeof visibility) => {
    const newValue = !localVisibility[key];
    const updated = { ...localVisibility, [key]: newValue };
    setLocalVisibility(updated);
    if (quote._id) {
      localStorage.setItem(`visibility_${quote._id}`, JSON.stringify(updated));
    }
    addToast(`${newValue ? 'Showing' : 'Hidden'} ${key === 'showAuthor' ? 'Author' : 'Category'}`, 'success');
  };
  
  const touchStart = useRef<number | null>(null);

  const closeMenu = () => {
    setShowMenu(false);
    if (onMenuOpenChange) {
      onMenuOpenChange(false);
    }
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextShowMenu = !showMenu;
    if (nextShowMenu && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const distToBottom = vh - rect.bottom;
      setOpenUpward(distToBottom < 280);
    }
    setShowMenu(nextShowMenu);
    if (onMenuOpenChange) {
      onMenuOpenChange(nextShowMenu);
    }
  };

  useImperativeHandle(ref, () => ({
    handleShare: (e) => handleShare(e),
    handleDownload: (e) => handleDownload(e),
    getCanvas: async () => {
      return await drawQuoteCardCanvas(quote.content || '', quote.author, font);
    },
    sharing,
    downloading
  }), [sharing, downloading, quote, font]);

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMenu();
    setPlaylistModalQuote({
      id: quote._id || Date.now().toString(),
      quoteText: quote.content || "",
      author: quote.author || "",
      category: "General",
      imageUrl: ""
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    closeMenu();
    
    if (downloading) return;
    setDownloading(true);

    try {
      const canvas = await drawQuoteCardCanvas(quote.content || '', quote.author, font);
      if (!canvas) throw new Error('Canvas rendering failed');
      
      const link = document.createElement('a');
      link.download = `SoulScript-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      incrementDownload();
      addToast('✅ Quote Card saved!', 'success');
    } catch (err) {
      console.error('Download failed', err);
      addToast('❌ Download failed. Try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    closeMenu();
    
    if (sharing) return;
    setSharing(true);

    try {
      const canvas = await drawQuoteCardCanvas(quote.content || '', quote.author, font);
      if (!canvas) throw new Error('Canvas rendering failed');
      
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error('Blob conversion failed');
      
      const file = new File([blob], 'SoulScript.png', { type: 'image/png' });
      const text = `"${quote.content}" — ${quote.author}`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'SoulScript',
            text: text
          });
          incrementDownload();
          addToast('✅ General share completed!', 'success');
          return;
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.warn('Native share failed, using fallback modal', err);
          } else {
            return;
          }
        }
      }
      
      setShareBlob(blob);
      setShareThumbnail(canvas.toDataURL('image/png'));
      setShowShareModal(true);
      incrementDownload();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share process failed', err);
        addToast('❌ Share failed. Try copying text.', 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    closeMenu();
    const text = `"${quote.content}"${quote.author ? ` — ${quote.author}` : ''}`;
    const success = await copyToClipboard(text);
    if (success) {
      addToast('✅ Copied to clipboard!', 'success');
    } else {
      addToast('❌ Clipboard copy failed.', 'error');
    }
  };

  const handleEditInGenerate = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    closeMenu();
    setGeneratePreloadedQuote({
      content: quote.content || "",
      author: quote.author || "",
      category: 'motivational',
      imageUrl: ""
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

  // Sizing utility mimicking Georgia font fluid sizing to avoid overflowing
  const getDynamicFontSizeStyle = (text: string) => {
    const len = text.length;
    if (isReels) {
      if (len < 60) return 'text-2xl sm:text-3xl md:text-5xl';
      if (len < 120) return 'text-xl sm:text-2xl md:text-4xl';
      if (len < 200) return 'text-lg sm:text-xl md:text-3xl';
      return 'text-base sm:text-lg md:text-2xl';
    }
    if (isPreview) {
      if (len < 60) return 'text-lg sm:text-xl md:text-3xl';
      if (len < 120) return 'text-base sm:text-lg md:text-2xl';
      if (len < 200) return 'text-sm sm:text-base md:text-xl';
      return 'text-xs sm:text-sm md:text-base';
    }
    // Default Grid
    if (len < 60) return 'text-sm sm:text-base md:text-2xl';
    if (len < 120) return 'text-xs sm:text-sm md:text-xl';
    if (len < 200) return 'text-[11px] sm:text-xs md:text-lg';
    return 'text-[10px] sm:text-[11px] md:text-base';
  };

  return (
    <div 
      id={`quote-card-${quote._id || 'preview'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => {
        if (selectionMode) {
          onToggleSelect?.();
        } else {
          handleDoubleTap(e);
        }
      }}
      className={cn(
        "relative rounded-none shadow-2xl transition-all cursor-pointer overflow-hidden",
        (!className || !className.includes('aspect-')) && "aspect-[9/16]",
        "bg-gradient-to-b from-[#160824] to-[#340B2D]", // Luxury premium gradient
        isReels ? "h-full w-full" : "w-full",
        selectionMode && "ring-offset-2 ring-offset-dark-bg transition-shadow duration-300",
        selectionMode && isSelected && "ring-4 ring-purple-500",
        className
      )}
      style={showMenu ? { zIndex: 100 } : {}}
    >
      {/* Dynamic Overlay & Checkbox in Selection Mode */}
      {selectionMode && (
        <div 
          className="absolute inset-0 z-10 transition-all duration-300 pointer-events-none" 
          style={isSelected ? { backgroundColor: 'rgba(168, 85, 247, 0.15)' } : {}}
        />
      )}

      {selectionMode && (
        <div className="absolute top-4 left-4 z-20">
          <div 
            className={cn(
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
              isSelected 
                ? "bg-purple-600 border-purple-600 text-white" 
                : "border-white/40 bg-black/40 group-hover:border-white"
            )}
          >
            {isSelected && <Check size={16} strokeWidth={4} />}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="p-8 rounded-full bg-white/10 backdrop-blur-md">
              <span className="text-red-500 text-7xl">♥</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Quote Content exactly as requested by user aesthetic */}
      <div className={cn(
        "relative flex flex-col items-center justify-between text-center select-none w-full h-full",
        isReels ? "sm:px-8 px-4 pb-36 pt-16 sm:pt-24" : "sm:px-8 px-3 sm:pb-12 pb-4 sm:pt-14 pt-6"
      )}>
        {/* TOP CENTER: Quotation symbol, about 5% card height */}
        {localVisibility.showQuoteMarks && (
          <div className="text-[#FFD700] text-xl sm:text-3xl md:text-5xl font-serif leading-none mt-1 sm:mt-2">
            ❝
          </div>
        )}

        {/* MIDDLE: Quote text in large white italic serif font with text shadow */}
        <div className="flex-1 flex items-center justify-center w-full my-1 sm:my-3">
          {localVisibility.showQuote && (
            <p 
              className={cn(
                "italic font-serif text-slate-100 leading-relaxed font-medium tracking-normal px-2 antialiased",
                getDynamicFontSizeStyle(quote.content || "")
              )}
              style={{
                fontFamily: font,
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.45)'
              }}
            >
              {quote.content?.replace(/^["'“'‟]+|["'”'‟]+$/g, '').trim()}
            </p>
          )}
        </div>

        {/* BOTTOM ELEMENTS: Short line, Author, and Brand watermark */}
        <div className="flex flex-col items-center w-full shrink-0 gap-2 sm:gap-4">
          
          {/* BELOW QUOTE: Thin short gold horizontal line centered */}
          <div className="w-8 sm:w-12 border-t-[1.5px] border-[#FFD700]" />

          {/* BELOW LINE: Author in small gold capital letters */}
          {localVisibility.showAuthor && quote.author && (
            <cite className="text-[#FFD700] text-[9px] sm:text-[10px] md:text-xs font-sans font-extrabold tracking-[0.2em] sm:tracking-[0.25em] uppercase not-italic">
              {quote.author.trim()}
            </cite>
          )}

          {/* BOTTOM: Small "SOULSCRIPT" watermark in 40% opacity */}
          <div className="text-[7px] sm:text-[8px] md:text-[9px] font-black tracking-[0.25em] sm:tracking-[0.3em] text-white/40 uppercase font-sans mt-2 sm:mt-4">
            SOULSCRIPT
          </div>
        </div>
      </div>

      {/* 3-Dot Dropdown Trigger Menu */}
      <div className="absolute top-4 right-4 z-20" ref={menuRef}>
        <button
          onClick={toggleMenu}
          className={cn(
            "p-2 rounded-full border border-white/20 shadow-lg transition-all active:scale-95",
            showMenu ? "bg-white text-black" : "bg-black/50 text-white hover:bg-black/70"
          )}
        >
          {showMenu ? <X size={18} /> : <MoreVertical size={18} />}
        </button>

        {/* Dropdown Menu block */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: openUpward ? 10 : -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: openUpward ? 10 : -10, scale: 0.95 }}
              className={cn(
                "absolute right-0 bg-black/95 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-[110] w-[210px]",
                openUpward ? "bottom-full mb-2 origin-bottom-right" : "top-full mt-2 origin-top-right"
              )}
            >
              <div className="flex flex-col py-1">
                {customMenuOptions ? (
                  customMenuOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        opt.onClick();
                        closeMenu();
                      }}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 text-left"
                    >
                      <span className="shrink-0">{opt.icon}</span>
                      <span className="flex-1">{opt.label}</span>
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={handleEditInGenerate}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors border-b border-white/5 text-left"
                    >
                      <Palette size={15} className="text-pink-400 shrink-0" />
                      <span>Edit Design</span>
                    </button>
                    <button
                      onClick={handleAddToPlaylist}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors border-b border-white/5 text-left"
                    >
                      <Library size={15} className="text-indigo-400 shrink-0" />
                      <span>Add to Playlist</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors border-b border-white/5 text-left"
                    >
                      <Copy size={15} className="text-slate-400 shrink-0" />
                      <span>Copy Quote</span>
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={sharing}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors border-b border-white/5 text-left"
                    >
                      {sharing ? <Loader2 size={15} className="text-purple-400 animate-spin shrink-0" /> : <Share2 size={15} className="text-purple-400 shrink-0" />}
                      <span>{sharing ? 'Sharing...' : 'Share Card'}</span>
                    </button>
                    <button
                      onClick={() => handleDownload()}
                      disabled={downloading}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors border-b border-white/5 text-left"
                    >
                      <Download size={15} className="text-emerald-400 shrink-0" />
                      <span>{downloading ? 'Saving...' : 'Download Card'}</span>
                    </button>
                  </>
                )}
 
                {/* Visibility Toggle Items */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVisibility('showAuthor'); }}
                  className="w-full h-11 flex items-center gap-3 px-4 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors border-b border-white/5 text-left"
                >
                  {localVisibility.showAuthor ? <EyeOff size={15} className="text-gray-400 shrink-0" /> : <Eye size={15} className="text-gray-400 shrink-0" />}
                  <span>{localVisibility.showAuthor ? 'Hide Author' : 'Show Author'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Share Modal Dialog */}
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
