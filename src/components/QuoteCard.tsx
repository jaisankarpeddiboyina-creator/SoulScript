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
  Link2,
  Check,
  Library,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import html2canvas from 'html2canvas';

// Helper function to capture the quote card as a canvas
const captureQuoteCard = async (cardRef: React.RefObject<HTMLDivElement | null>, quoteId?: string) => {
  if (!cardRef.current) return null;
  
  const element = cardRef.current;
  
  try {
    // We remove scrollX/scrollY and windowWidth/windowHeight overrides as they cause 
    // "Unable to find element in cloned iframe" errors when rendered within iframe sandboxes.
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      scale: 3, // Higher scale for better quality
      backgroundColor: null,
      logging: false,
      imageTimeout: 20000,
      onclone: (clonedDoc, clonedElement) => {
        // Direct reference to the cloned target element prevents ID/query failures
        if (clonedElement) {
          clonedElement.style.visibility = 'visible';
          clonedElement.style.display = 'block';
          clonedElement.style.transform = 'none';
          clonedElement.style.opacity = '1';
        }

        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach((el) => {
          const htmlElement = el as HTMLElement;
          const style = htmlElement.style;
          
          if (style.backdropFilter) style.backdropFilter = 'none';
          if (style.filter && style.filter.includes('blur')) style.filter = 'none';
          
          const computed = clonedDoc.defaultView?.getComputedStyle(el);
          const colorProps = ['color', 'backgroundColor', 'borderColor', 'boxShadow', 'fill', 'stroke'];
          
          colorProps.forEach(prop => {
            const val = computed?.getPropertyValue(prop);
            if (val && (val.includes('oklch') || val.includes('oklab'))) {
              if (prop === 'boxShadow') htmlElement.style.boxShadow = 'none';
              else if (prop === 'backgroundColor') htmlElement.style.backgroundColor = 'rgba(0,0,0,0)';
              else if (prop === 'color') htmlElement.style.color = '#ffffff';
              else (htmlElement.style as any)[prop] = 'inherit';
            }
          });
        });
      },
      ignoreElements: (el) => {
        return el.classList.contains('z-10') || el.tagName === 'BUTTON' || el.classList.contains('z-20');
      }
    });
    return canvas;
  } catch (err) {
    console.error('html2canvas error:', err);
    throw err;
  }
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

const drawFallbackCanvas = (content: string, author?: string, category?: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let gradStart = '#111827';
  let gradMiddle = '#1e1b4b';
  let gradEnd = '#311042';
  let spotColor1 = 'rgba(236, 72, 153, 0.15)';
  let spotColor2 = 'rgba(79, 70, 229, 0.15)';

  const cat = (category || '').toLowerCase();
  if (cat === 'wisdom' || cat === 'philosophical') {
    gradStart = '#022c22';
    gradMiddle = '#0f172a';
    gradEnd = '#134e4a';
    spotColor1 = 'rgba(16, 185, 129, 0.12)';
    spotColor2 = 'rgba(14, 116, 144, 0.15)';
  } else if (cat === 'love' || cat === 'relationship') {
    gradStart = '#4c0519';
    gradMiddle = '#0f172a';
    gradEnd = '#500724';
    spotColor1 = 'rgba(244, 63, 94, 0.15)';
    spotColor2 = 'rgba(219, 39, 119, 0.12)';
  } else if (cat === 'hope' || cat === 'faith' || cat === 'spirituality') {
    gradStart = '#1e1b4b';
    gradMiddle = '#020617';
    gradEnd = '#172554';
    spotColor1 = 'rgba(99, 102, 241, 0.15)';
    spotColor2 = 'rgba(59, 130, 246, 0.12)';
  }

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
  gradient.addColorStop(0, gradStart);
  gradient.addColorStop(0.5, gradMiddle);
  gradient.addColorStop(1, gradEnd);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1080);

  ctx.fillStyle = spotColor1;
  ctx.beginPath();
  ctx.arc(250, 250, 350, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = spotColor2;
  ctx.beginPath();
  ctx.arc(830, 830, 400, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 36;
  ctx.strokeRect(18, 18, 1044, 1044);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 60, 960, 960);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'italic bold 220px Georgia, serif';
  ctx.fillText('“', 540, 260);

  ctx.fillStyle = '#ffffff';
  const fontSize = content.length > 200 ? 34 : (content.length > 120 ? 40 : 46);
  ctx.font = `italic ${fontSize}px Georgia, "Playfair Display", serif`;
  
  const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    const lines = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    
    let currentY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      context.fillText(lines[i].trim(), x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  };

  const endY = wrapText(ctx, `"${content}"`, 540, 550, 780, fontSize * 1.5);

  if (author) {
    ctx.font = 'normal 12px "Inter", "Segoe UI", sans-serif';
    const spacedAuthor = author.toUpperCase().split('').join('  ');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText(spacedAuthor, 540, Math.min(endY + 80, 860));
  }

  ctx.font = 'normal 13px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fillText('SOULSCRIPT', 540, 930);

  return canvas;
};

import { Quote, QuoteCategory } from '../types';
import { cn, copyToClipboard } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PHOTO_KEYWORDS } from '../constants';

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
  image, 
  category, 
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
    showCategory: true,
    showQuoteMarks: true
  },
  font = 'Playfair Display'
}, ref) => {
  const { addToast, setActiveTab, setGeneratePreloadedQuote, setPlaylistModalQuote } = useApp();
  const { canDownload, incrementDownload, isGuest, setGatingType, plan } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [shareThumbnail, setShareThumbnail] = useState<string | null>(null);
  
  // Local visibility settings per quote
  const [localVisibility, setLocalVisibility] = useState(visibility);
  const [openUpward, setOpenUpward] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);
  const [mobileMenuStyles, setMobileMenuStyles] = useState<React.CSSProperties>({});

  React.useEffect(() => {
    if (quote._id) {
      const saved = localStorage.getItem(`visibility_${quote._id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLocalVisibility(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse visibility', e);
        }
        return;
      }
    }
    
    setLocalVisibility(visibility);
  }, [quote._id, visibility.showQuote, visibility.showAuthor, visibility.showCategory, visibility.showQuoteMarks]);

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
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth <= 768;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      const menuWidth = isMobile ? Math.min(240, vw - 32) : 220;
      const padding = 16;
      
      // Vertical placement
      const distToBottom = vh - rect.bottom;
      const shouldOpenUp = distToBottom < 300;
      setOpenUpward(shouldOpenUp);
      
      if (isMobile) {
        let styles: React.CSSProperties = {
          width: `${menuWidth}px`,
          position: 'absolute',
          zIndex: 110
        };

        // Horizontal placement
        // Anchor right (expand left)
        const leftIfAnchorRight = rect.right - menuWidth;
        // Anchor left (expand right)
        const rightIfAnchorLeft = rect.left + menuWidth;
        
        if (leftIfAnchorRight >= padding) {
          styles.right = '0';
          styles.left = 'auto';
          setOpenLeft(true);
        } else if (rightIfAnchorLeft <= vw - padding) {
          styles.left = '0';
          styles.right = 'auto';
          setOpenLeft(false);
        } else {
          // Force center-ish based on screen padding
          styles.left = `${padding - rect.left}px`;
          styles.right = 'auto';
          setOpenLeft(false);
        }
        
        setMobileMenuStyles(styles);
      } else {
        setOpenLeft(vw - rect.right < 250);
        setMobileMenuStyles({});
      }
    }
    setShowMenu(!showMenu);
  };

  useImperativeHandle(ref, () => ({
    handleShare: (e) => handleShare(e),
    handleDownload: (e) => handleDownload(e),
    getCanvas: () => captureQuoteCard(cardRef, quote._id),
    sharing,
    downloading
  }), [sharing, downloading]);

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    setPlaylistModalQuote({
      id: quote._id || Date.now().toString(),
      quoteText: quote.content || "",
      author: quote.author || "",
      category: (category as string) || "General",
      imageUrl: image || ""
    });
  };

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
    
    // REMOVED GATING: Download works for everyone from card
    // if (!canDownload()) return;
    
    if (!cardRef.current || downloading) return;
    
    setDownloading(true);
    try {
      let canvas;
      try {
        canvas = await captureQuoteCard(cardRef, quote._id);
        if (!canvas) throw new Error('Capture failed');
      } catch (err) {
        console.warn('DOM capture failed, falling back to clean canvas render:', err);
        canvas = drawFallbackCanvas(quote.content || '', quote.author, category);
        if (!canvas) throw new Error('Fallback canvas generation failed');
      }
      
      const link = document.createElement('a');
      link.download = `SoulScript-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      
      // Increment counter on success
      incrementDownload();
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
    
    // REMOVED GATING: Share works for everyone
    // if (!canDownload()) return;
    
    if (sharing || !cardRef.current) return;

    setSharing(true);
    try {
      let canvas;
      try {
        canvas = await captureQuoteCard(cardRef, quote._id);
        if (!canvas) throw new Error('Capture failed');
      } catch (err) {
        console.warn('DOM capture failed during share, falling back to clean canvas render:', err);
        canvas = drawFallbackCanvas(quote.content || '', quote.author, category);
        if (!canvas) throw new Error('Fallback canvas generation failed');
      }
      
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
          
          // Increment counter on success
          incrementDownload();
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
      
      // Also count for fallback share modal (as it allows saving image)
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
    setShowMenu(false);
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
      id={`quote-card-${quote._id || 'preview'}`}
      ref={cardRef}
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
        "relative group rounded-2xl shadow-2xl bg-black transition-all cursor-pointer",
        isReels ? "h-full w-full rounded-none" : "w-full min-h-[280px] h-auto",
        isPreview && "aspect-square",
        selectionMode && "ring-offset-2 ring-offset-dark-bg transition-shadow duration-300",
        selectionMode && isSelected && "ring-4 ring-purple-500",
        className
      )}
      style={showMenu ? { zIndex: 100 } : {}}
    >
      <div className={cn(
        "absolute inset-0 z-0 rounded-2xl overflow-hidden",
        isReels && "rounded-none"
      )}>
        {/* Selection Overlay */}
        {selectionMode && (
          <div 
            className={cn(
              "absolute inset-0 z-[15] transition-all duration-300 pointer-events-none",
              isSelected ? "" : "bg-transparent"
            )} 
            style={isSelected ? { backgroundColor: 'rgba(168, 85, 247, 0.1)' } : {}}
          />
        )}

        {/* Checkbox Icon */}
        {selectionMode && (
          <div className="absolute top-4 left-4 z-[20]">
            <div 
              className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-purple-600 border-purple-600 text-white" 
                  : "border-white/40 group-hover:border-white"
              )}
              style={!isSelected ? { backgroundColor: 'rgba(0, 0, 0, 0.3)' } : {}}
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
                const safeKeyword = PHOTO_KEYWORDS[Math.floor(Math.random() * PHOTO_KEYWORDS.length)];
                
                if (!target.src.includes('picsum.photos')) {
                  target.src = `https://picsum.photos/seed/${seed}/1920/1080`;
                } else if (target.src.includes('picsum.photos')) {
                  // If pixsum also fails, use a secondary loremflickr with ultra-safe tag
                  target.src = `https://loremflickr.com/1920/1080/${safeKeyword}?lock=${seed}`;
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
        <div 
          className="absolute inset-0 transition-opacity" 
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.75))' }}
        />

        {/* Content */}
        <div className={cn(
          "relative flex flex-col p-4 md:p-6 min-h-[220px] md:min-h-[280px] h-full",
          isReels ? "h-full items-center text-center justify-center max-w-3xl mx-auto pb-32" : "justify-start gap-3 md:gap-4"
        )}>
          <div className={cn(
            "relative flex flex-col",
            isReels ? "w-full overflow-hidden flex-1 justify-center" : ""
          )}>
            {localVisibility.showQuote && (
              <div className={cn(
                "font-serif font-bold text-white tracking-tight transition-all drop-shadow-md",
                (isReels || isPreview) && "h-full overflow-y-auto custom-scrollbar px-2 flex flex-col justify-center"
              )}
              style={{ 
                fontSize: getQuoteFontSize(quote.content?.length || 0), 
                lineHeight: '1.45',
                fontFamily: font
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
            {localVisibility.showAuthor && quote.author && (
              <cite 
                className="text-white text-sm md:text-base font-bold not-italic drop-shadow-sm"
                style={{ fontFamily: font }}
              >
                {quote.author}
              </cite>
            )}
            {localVisibility.showCategory && category && (
              <span className="text-[10px] uppercase tracking-[1.5px] text-white/60 font-medium drop-shadow-sm">
                {category}
              </span>
            )}
          </div>

          {/* Subtle Watermark for FREE/GUEST users */}
          {(plan === 'free' || !plan) && (
            <div className="absolute bottom-4 right-6 flex items-center gap-1.5 opacity-40 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 pointer-events-none">
              <Sparkles size={10} className="text-pink-400" />
              <span className="text-[9px] font-bold tracking-widest text-[#f3f4f6] uppercase font-serif">SoulScript</span>
            </div>
          )}
        </div>
      </div>

      {/* 3-Dot Menu Button - Kept outside the overflow-hidden wrapper */}
      <div className="absolute top-4 right-4 z-20" ref={menuRef}>
        <button
          onClick={toggleMenu}
          className={cn(
            "p-2 rounded-full border border-white/20 shadow-lg transition-all active:scale-95",
            showMenu ? "bg-white text-black" : "bg-black/50 text-white hover:bg-black/70"
          )}
          title="Actions"
        >
          {showMenu ? <X size={20} /> : <MoreVertical size={20} />}
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              id="quote-card-menu"
              initial={{ 
                opacity: 0, 
                y: openUpward ? 10 : -10, 
                x: openLeft ? 10 : -10,
                scale: 0.95 
              }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={{ 
                opacity: 0, 
                y: openUpward ? 10 : -10, 
                x: openLeft ? 10 : -10,
                scale: 0.95 
              }}
              className={cn(
                "absolute bg-black/95 border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-[110]",
                openUpward ? "bottom-full mb-3" : "top-full mt-3",
                Object.keys(mobileMenuStyles).length === 0 ? (
                  cn("w-[220px]", openLeft ? "right-0 origin-top-right" : "left-0 origin-top-left")
                ) : (
                  // Mobile dynamic origins
                  openUpward ? (openLeft ? "origin-bottom-right" : "origin-bottom-left") : (openLeft ? "origin-top-right" : "origin-top-left")
                ),
                Object.keys(mobileMenuStyles).length === 0 && openUpward && openLeft && "origin-bottom-right",
                Object.keys(mobileMenuStyles).length === 0 && openUpward && !openLeft && "origin-bottom-left"
              )}
              style={mobileMenuStyles}
            >
              <div className="flex flex-col py-1">
                {customMenuOptions ? (
                  customMenuOptions.map((opt, i) => (
                    <button
                      key={i}
                      id={`menu-item-custom-${i}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        opt.onClick();
                        setShowMenu(false);
                      }}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[14px] font-medium text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 whitespace-nowrap text-left"
                    >
                      <span className="shrink-0">{opt.icon}</span>
                      <span className="flex-1">{opt.label}</span>
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      id="menu-item-edit-design"
                      onClick={handleEditInGenerate}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[14px] font-medium text-white hover:bg-white/10 transition-colors border-b border-white/5 whitespace-nowrap text-left"
                    >
                      <Palette size={16} className="text-pink-400 shrink-0" />
                      <span>Edit Design</span>
                    </button>
                    <button
                      id="menu-item-add-playlist"
                      onClick={handleAddToPlaylist}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[14px] font-medium text-white hover:bg-white/10 transition-colors border-b border-white/5 whitespace-nowrap text-left"
                    >
                      <Library size={16} className="text-indigo-400 shrink-0" />
                      <span>Add to Playlist</span>
                    </button>
                    <button
                      id="menu-item-copy-quote"
                      onClick={handleCopy}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[14px] font-medium text-white hover:bg-white/10 transition-colors border-b border-white/5 whitespace-nowrap text-left"
                    >
                      <Copy size={16} className="text-slate-400 shrink-0" />
                      <span>Copy Quote</span>
                    </button>
                    <button
                      id="menu-item-share-card"
                      onClick={handleShare}
                      disabled={sharing}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[14px] font-medium text-white hover:bg-white/10 transition-colors border-b border-white/5 whitespace-nowrap text-left"
                    >
                      {sharing ? <Loader2 size={16} className="text-purple-400 animate-spin shrink-0" /> : <Share2 size={16} className="text-purple-400 shrink-0" />}
                      <span>{sharing ? 'Sharing...' : 'Share Card'}</span>
                    </button>
                    <button
                      id="menu-item-download-card"
                      onClick={() => handleDownload()}
                      disabled={downloading}
                      className="w-full h-11 flex items-center gap-3 px-4 text-[14px] font-medium text-white hover:bg-white/10 transition-colors border-b border-white/5 whitespace-nowrap text-left"
                    >
                      <Download size={16} className="text-emerald-400 shrink-0" />
                      <span>{downloading ? 'Saving...' : 'Download Card'}</span>
                    </button>
                  </>
                )}
 
                {/* Common Toggles (Visible everywhere) */}
                <button
                  id="menu-item-toggle-author"
                  onClick={(e) => { e.stopPropagation(); toggleVisibility('showAuthor'); }}
                  className="w-full h-11 flex items-center gap-3 px-4 text-[14px] font-medium text-white hover:bg-white/10 transition-colors border-b border-white/5 whitespace-nowrap text-left"
                >
                  {localVisibility.showAuthor ? <EyeOff size={16} className="text-gray-400 shrink-0" /> : <Eye size={16} className="text-gray-400 shrink-0" />}
                  <span>{localVisibility.showAuthor ? 'Hide Author Name' : 'Show Author Name'}</span>
                </button>
                <button
                  id="menu-item-toggle-category"
                  onClick={(e) => { e.stopPropagation(); toggleVisibility('showCategory'); }}
                  className="w-full h-11 flex items-center gap-3 px-4 text-[14px] font-medium text-white hover:bg-white/10 transition-colors whitespace-nowrap text-left"
                >
                  {localVisibility.showCategory ? <EyeOff size={16} className="text-gray-400 shrink-0" /> : <Eye size={16} className="text-gray-400 shrink-0" />}
                  <span>{localVisibility.showCategory ? 'Hide Category Tag' : 'Show Category Tag'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
