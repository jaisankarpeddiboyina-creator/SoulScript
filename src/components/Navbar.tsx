import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Sparkles, Settings as SettingsIcon, Moon, Sun, Library, Send, LayoutGrid, BookMarked, User, LogOut, LogIn, Zap, Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

interface NavbarProps {
  onSignInClick: () => void;
  onProfileClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSignInClick, onProfileClick }) => {
  const { activeTab, setActiveTab, theme, toggleTheme } = useApp();
  const { addToast } = useApp();
  const { user, signOut, isGuest, setGatingType } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getAvatarUrl = (user: any) => {
    if (user.avatar) {
      return `${import.meta.env.VITE_POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}`;
    }
    return null;
  };

  return (
    <nav className="sticky top-0 z-40 w-full px-4 pt-4 pb-2">
      <div className="max-w-7xl mx-auto glass rounded-2xl md:rounded-full px-4 md:px-3 lg:px-8 py-3 flex items-center justify-between shadow-lg border border-[var(--border-color)]">
        <div className="flex items-center gap-2 group cursor-pointer shrink-0" onClick={() => setActiveTab('explore')}>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full gradient-bg flex items-center justify-center border border-white/20 shadow-sm group-hover:scale-110 transition-transform">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-xl md:hidden lg:inline-block lg:text-2xl font-bold font-serif text-[var(--text-primary)]">SoulScript</span>
        </div>

        <div className="hidden md:flex items-center justify-center flex-1 gap-0.5 lg:gap-3 px-1 lg:px-4">
          <button
            onClick={() => setActiveTab('explore')}
            className={cn(
              "relative px-[10px] py-[8px] lg:px-4 lg:py-2 text-[13px] lg:text-sm font-medium transition-colors rounded-full whitespace-nowrap",
              activeTab === 'explore' ? "text-[var(--text-primary)] bg-white/5" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-1 lg:gap-2">
              <Compass size={18} />
              <span>Explore</span>
            </div>
            {activeTab === 'explore' && (
              <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-[2px] left-3 right-3 h-[2px] gradient-bg rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={cn(
              "relative px-[10px] py-[8px] lg:px-4 lg:py-2 text-[13px] lg:text-sm font-medium transition-colors rounded-full whitespace-nowrap",
              activeTab === 'collections' ? "text-[var(--text-primary)] bg-white/5" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-1 lg:gap-2">
              <LayoutGrid size={18} />
              <span>Collections</span>
            </div>
            {activeTab === 'collections' && (
              <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-[2px] left-3 right-3 h-[2px] gradient-bg rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab('generate')}
            className={cn(
              "relative px-[10px] py-[8px] lg:px-4 lg:py-2 text-[13px] lg:text-sm font-medium transition-colors rounded-full whitespace-nowrap",
              activeTab === 'generate' ? "text-[var(--text-primary)] bg-white/5" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-1 lg:gap-2">
              <Sparkles size={18} />
              <span>Generate</span>
            </div>
            {activeTab === 'generate' && (
              <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-[2px] left-3 right-3 h-[2px] gradient-bg rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('playlists');
            }}
            className={cn(
              "relative px-[10px] py-[8px] lg:px-4 lg:py-2 text-[13px] lg:text-sm font-medium transition-colors rounded-full whitespace-nowrap",
              activeTab === 'playlists' ? "text-[var(--text-primary)] bg-white/5" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-1 lg:gap-2">
              <BookMarked size={18} />
              <span>Playlists</span>
            </div>
            {activeTab === 'playlists' && (
              <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-[2px] left-3 right-3 h-[2px] gradient-bg rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('delivery');
            }}
            className={cn(
              "relative px-[10px] py-[8px] lg:px-4 lg:py-2 text-[13px] lg:text-sm font-medium transition-colors rounded-full whitespace-nowrap",
              activeTab === 'delivery' ? "text-[var(--text-primary)] bg-white/5" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-1 lg:gap-2">
              <Send size={18} />
              <span>Delivery</span>
            </div>
            {activeTab === 'delivery' && (
              <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-[2px] left-3 right-3 h-[2px] gradient-bg rounded-full"
              />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('pricing');
            }}
            className={cn(
              "relative px-[10px] py-[8px] lg:px-4 lg:py-2 text-[13px] lg:text-sm font-medium transition-colors rounded-full whitespace-nowrap",
              activeTab === 'pricing' ? "text-[var(--text-primary)] bg-white/5" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5"
            )}
          >
            <div className="flex items-center gap-1 lg:gap-2">
              <Zap size={17} className="text-pink-400" />
              <span>Pricing</span>
            </div>
            {activeTab === 'pricing' && (
              <motion.div
                layoutId="nav-underline"
                className="absolute -bottom-[2px] left-3 right-3 h-[2px] gradient-bg rounded-full"
              />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 transition-all rounded-full hover:bg-black/10 text-[var(--text-secondary)] hover:text-indigo-400"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold border border-white/20 hover:scale-110 transition-transform overflow-hidden shadow-lg"
              >
                {getAvatarUrl(user) ? (
                  <img src={getAvatarUrl(user)} alt={user.name} className="w-full h-full object-cover" />
                ) : getInitials(user.name || user.email)}
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 glass border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden py-1 z-50"
                  >
                    <div className="px-4 py-3 border-b border-[var(--border-color)]">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.name || 'User'}</p>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { setShowDropdown(false); onProfileClick(); }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 flex items-center gap-3 transition-colors"
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </button>
                    <button 
                      onClick={() => { setShowDropdown(false); setActiveTab('pricing'); }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 flex items-center gap-3 transition-colors"
                    >
                      <Zap size={16} className="text-pink-400" />
                      <span>Pricing & Plans</span>
                    </button>
                    <button 
                      onClick={() => { signOut(); setShowDropdown(false); addToast('Signed out successfully', 'success'); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={onSignInClick}
              className="px-4 py-1.5 text-sm font-bold rounded-full gradient-bg text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              <LogIn size={16} />
              <span className="md:hidden lg:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const { isGuest, setGatingType } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isMenuOptionActive = activeTab === 'delivery' || activeTab === 'pricing';

  return (
    <>
      {/* Expandable Menu Pop-up / Bottom Sheet */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Dark blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />
            {/* Pop-up Container */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-md glass rounded-3xl p-5 border border-zinc-200/50 dark:border-white/10 shadow-2xl flex flex-col gap-3 text-left md:hidden"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200/50 dark:border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Menu size={14} className="text-zinc-600 dark:text-zinc-400" />
                  <span>SoulScript Menu</span>
                </h3>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-[10px] font-black uppercase tracking-wider"
                >
                  Close
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <button
                  onClick={() => {
                    setActiveTab('delivery');
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3.5 p-3 rounded-2xl w-full text-left transition-all border",
                    activeTab === 'delivery'
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-400"
                      : "bg-transparent border-transparent text-zinc-700 hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:bg-white/5"
                  )}
                >
                  <Send size={18} className={activeTab === 'delivery' ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400"} />
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold uppercase tracking-wide">Delivery Schedules</span>
                    <span className="text-[10px] opacity-80 mt-0.5 leading-relaxed">Configure automatic daily quote dispatch</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('pricing');
                    setIsMenuOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3.5 p-3 rounded-2xl w-full text-left transition-all border",
                    activeTab === 'pricing'
                      ? "bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-500/15 dark:border-pink-500/30 dark:text-pink-400"
                      : "bg-transparent border-transparent text-zinc-700 hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:bg-white/5"
                  )}
                >
                  <Zap size={18} className="text-pink-600 dark:text-pink-400" />
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold uppercase tracking-wide">Upgrade & Pricing</span>
                    <span className="text-[10px] opacity-80 mt-0.5 leading-relaxed">Unlock HD downloads, clean cards & pro access</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-sm">
        <div className="glass rounded-full p-2 flex items-center justify-between shadow-2xl border border-[var(--border-color)]">
          <button
            onClick={() => {
              setActiveTab('explore');
              setIsMenuOpen(false);
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all py-2 px-1 rounded-2xl min-h-[48px] h-12 hover:bg-black/5 dark:hover:bg-white/5",
              activeTab === 'explore' ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-zinc-650 dark:text-zinc-350 hover:text-zinc-805 dark:hover:text-zinc-200 font-semibold"
            )}
          >
            <Compass size={19} className={cn("transition-transform shrink-0", activeTab === 'explore' && "scale-110")} />
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-center w-full truncate">Explore</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('collections');
              setIsMenuOpen(false);
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all py-2 px-1 rounded-2xl border-l border-zinc-200/50 dark:border-white/5 min-h-[48px] h-12 hover:bg-black/5 dark:hover:bg-white/5",
              activeTab === 'collections' ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-zinc-650 dark:text-zinc-350 hover:text-zinc-805 dark:hover:text-zinc-200 font-semibold"
            )}
          >
            <LayoutGrid size={19} className={cn("transition-transform shrink-0", activeTab === 'collections' && "scale-110")} />
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-center w-full truncate">Collect</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('generate');
              setIsMenuOpen(false);
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all py-2 px-1 rounded-2xl border-l border-zinc-200/50 dark:border-white/5 min-h-[48px] h-12 hover:bg-black/5 dark:hover:bg-white/5",
              activeTab === 'generate' ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-zinc-650 dark:text-zinc-350 hover:text-zinc-805 dark:hover:text-zinc-200 font-semibold"
            )}
          >
            <Sparkles size={19} className={cn("transition-transform shrink-0", activeTab === 'generate' && "scale-110")} />
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-center w-full truncate">Generate</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('playlists');
              setIsMenuOpen(false);
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all py-2 px-1 rounded-2xl border-l border-zinc-200/50 dark:border-white/5 min-h-[48px] h-12 hover:bg-black/5 dark:hover:bg-white/5",
              activeTab === 'playlists' ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-zinc-650 dark:text-zinc-350 hover:text-zinc-805 dark:hover:text-zinc-200 font-semibold"
            )}
          >
            <BookMarked size={19} className={cn("transition-transform shrink-0", activeTab === 'playlists' && "scale-110")} />
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-center w-full truncate">Playlists</span>
          </button>

          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
            }}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all py-2 px-1 rounded-2xl border-l border-zinc-200/50 dark:border-white/5 min-h-[48px] h-12 hover:bg-black/5 dark:hover:bg-white/5",
              isMenuOpen || isMenuOptionActive 
                ? "text-pink-500 dark:text-pink-400 font-extrabold"
                : "text-zinc-650 dark:text-zinc-350 hover:text-zinc-805 dark:hover:text-zinc-200 font-semibold"
            )}
          >
            <Menu size={19} className={cn("transition-transform shrink-0", (isMenuOpen || isMenuOptionActive) && "scale-110")} />
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-center w-full truncate">Menu</span>
          </button>
        </div>
      </div>
    </>
  );
};
