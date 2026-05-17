import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from './Navbar';
import { ExploreFilterGrid } from './ExploreFilterGrid';
import { cn } from '../lib/utils';
import { Filter } from 'lucide-react';

export const Header: React.FC = () => {
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
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
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
        <Navbar />
        {activeTab === 'explore' && <ExploreFilterGrid />}
      </header>

      {/* Spacer to push content down */}
      <div style={{ height: headerVisible || viewMode !== 'reels' ? headerHeight : 0 }} className="transition-[height] duration-300" />

      {/* Reels Pill */}
      {showPill && !headerVisible && (
        <button
          onClick={toggleHeaderTemporarily}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] px-4 py-2 bg-indigo-600/90 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-bounce"
        >
          <Filter size={14} />
          <span>Filters</span>
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
