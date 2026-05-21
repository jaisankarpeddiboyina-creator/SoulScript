import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from './Navbar';
import { ExploreFilterGrid } from './ExploreFilterGrid';
import { cn } from '../lib/utils';
import { Filter } from 'lucide-react';

interface HeaderProps {
  onSignInClick: () => void;
  onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSignInClick, onProfileClick }) => {
  const { viewMode, activeTab } = useApp();
  const [headerVisible, setHeaderVisible] = useState(true);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showPill, setShowPill] = useState(false);
  const pillTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 0) {
        setHeaderVisible(true);
      } else if (currentScrollY < lastScrollY) {
        setHeaderVisible(true);
      } else if (currentScrollY > lastScrollY + 5) {
        setHeaderVisible(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeaderHeight(entry.target.clientHeight);
      }
    });
    
    resizeObserver.observe(headerRef.current);
    
    // Fallback standard measurements
    setHeaderHeight(headerRef.current.offsetHeight);
    
    return () => resizeObserver.disconnect();
  }, [activeTab, viewMode]);

  // Reels mode behavior
  useEffect(() => {
    if (viewMode === 'reels' && activeTab === 'explore') {
      setHeaderVisible(false);
      setShowPill(true);
    } else {
      setShowPill(false);
    }
  }, [viewMode, activeTab]);

  const toggleHeaderTemporarily = () => {
    setHeaderVisible(true);
    if (pillTimeoutRef.current) clearTimeout(pillTimeoutRef.current);
    pillTimeoutRef.current = setTimeout(() => {
      if (viewMode === 'reels') setHeaderVisible(false);
    }, 3000);
  };

  return (
    <>
      <header 
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 z-100 transition-transform duration-300 ease-in-out",
          headerVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <Navbar onSignInClick={onSignInClick} onProfileClick={onProfileClick} />
        {activeTab === 'explore' && <ExploreFilterGrid />}
      </header>

      {/* Spacer to push content down */}
      <div style={{ height: headerVisible || viewMode !== 'reels' ? headerHeight : 0 }} className="transition-[height] duration-300" />

      {/* Reels Filter Button */}
      {showPill && !headerVisible && (
        <button
          onClick={toggleHeaderTemporarily}
          className="fixed top-6 left-6 z-[110] p-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full text-white shadow-2xl hover:bg-black/60 transition-all hover:scale-110 active:scale-95"
          title="Show Filters"
        >
          <Filter size={20} />
        </button>
      )}

      {/* Tap at top to show header in Reels mode */}
      {viewMode === 'reels' && activeTab === 'explore' && !headerVisible && (
        <div 
          className="fixed top-0 left-0 right-0 h-16 z-[90] cursor-pointer" 
          onClick={toggleHeaderTemporarily}
        />
      )}
    </>
  );
};
