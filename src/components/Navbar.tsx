import React from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, Settings as SettingsIcon, Moon, Sun, Library, Send, LayoutGrid, BookMarked } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, theme, toggleTheme } = useApp();

  return (
    <>
      <nav className="sticky top-0 z-40 w-full px-4 pt-4 pb-2">
        <div className="max-w-7xl mx-auto glass rounded-2xl md:rounded-full px-4 md:px-8 py-3 flex items-center justify-between shadow-lg border border-[var(--border-color)]">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('explore')}>
            <img 
              src="/icon.png" 
              alt="SoulScript Logo" 
              className="w-8 h-8 rounded-full border border-[var(--border-color)] shadow-sm group-hover:scale-110 transition-transform"
            />
            <span className="text-xl font-bold font-serif text-[var(--text-primary)]">SoulScript</span>
          </div>

          <div className="hidden md:flex items-center gap-1 md:gap-4">
            <button
              onClick={() => setActiveTab('explore')}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors rounded-full",
                activeTab === 'explore' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-2">
                <Compass size={18} />
                <span>Explore</span>
              </div>
              {activeTab === 'explore' && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-[2px] left-4 right-4 h-[2px] gradient-bg rounded-full"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('collections')}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors rounded-full",
                activeTab === 'collections' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-2">
                <LayoutGrid size={18} />
                <span>Collections</span>
              </div>
              {activeTab === 'collections' && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-[2px] left-4 right-4 h-[2px] gradient-bg rounded-full"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('generate')}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors rounded-full",
                activeTab === 'generate' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span>Generate</span>
              </div>
              {activeTab === 'generate' && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-[2px] left-4 right-4 h-[2px] gradient-bg rounded-full"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('playlists')}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors rounded-full",
                activeTab === 'playlists' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-2">
                <BookMarked size={18} />
                <span>Playlists</span>
              </div>
              {activeTab === 'playlists' && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-[2px] left-4 right-4 h-[2px] gradient-bg rounded-full"
                />
              )}
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className={cn(
                "relative px-4 py-2 text-sm font-medium transition-colors rounded-full",
                activeTab === 'delivery' ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <div className="flex items-center gap-2">
                <Send size={18} />
                <span>Delivery</span>
              </div>
              {activeTab === 'delivery' && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute -bottom-[2px] left-4 right-4 h-[2px] gradient-bg rounded-full"
                />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 transition-all rounded-full hover:bg-black/10 text-[var(--text-secondary)] hover:text-indigo-400"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-6 pt-2 bg-linear-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/95 to-transparent">
        <div className="glass rounded-full p-1.5 flex items-center justify-between shadow-2xl border border-[var(--border-color)] min-h-[72px]">
          <button
            onClick={() => setActiveTab('explore')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 transition-all py-2",
              activeTab === 'explore' ? "text-indigo-400" : "text-gray-500"
            )}
          >
            <Compass size={22} className={cn("transition-transform", activeTab === 'explore' && "scale-110")} />
            <span className="text-[10px] font-black uppercase tracking-wider text-center px-1">Explore</span>
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 transition-all py-2 border-l border-white/5",
              activeTab === 'collections' ? "text-indigo-400" : "text-gray-500"
            )}
          >
            <LayoutGrid size={22} className={cn("transition-transform", activeTab === 'collections' && "scale-110")} />
            <span className="text-[10px] font-black uppercase tracking-wider text-center px-1">Library</span>
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 transition-all py-2 border-l border-white/5",
              activeTab === 'generate' ? "text-indigo-400" : "text-gray-500"
            )}
          >
            <Sparkles size={22} className={cn("transition-transform", activeTab === 'generate' && "scale-110")} />
            <span className="text-[10px] font-black uppercase tracking-wider text-center px-1">Create</span>
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 transition-all py-2 border-l border-white/5",
              activeTab === 'playlists' ? "text-indigo-400" : "text-gray-500"
            )}
          >
            <BookMarked size={22} className={cn("transition-transform", activeTab === 'playlists' && "scale-110")} />
            <span className="text-[10px] font-black uppercase tracking-wider text-center px-1">Saves</span>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 transition-all py-2 border-l border-white/5",
              activeTab === 'delivery' ? "text-indigo-400" : "text-gray-500"
            )}
          >
            <Send size={22} className={cn("transition-transform", activeTab === 'delivery' && "scale-110")} />
            <span className="text-[10px] font-black uppercase tracking-wider text-center px-1">Alerts</span>
          </button>
        </div>
      </div>
    </>
  );
};
