import React from 'react';
import { motion } from 'motion/react';
import { Compass, Sparkles, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cn } from '../lib/utils';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab, theme, toggleTheme } = useApp();

  return (
    <>
      <nav className="sticky top-0 z-40 w-full px-4 pt-4 pb-2">
        <div className="max-w-7xl mx-auto glass rounded-2xl md:rounded-full px-4 md:px-8 py-3 flex items-center justify-between shadow-lg border border-[var(--border-color)]">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('explore')}>
            <div className="p-2 rounded-xl gradient-bg shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
              <Sparkles size={20} className="text-white" />
            </div>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-linear-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/95 to-transparent">
        <div className="glass rounded-full px-6 py-3 flex items-center justify-around shadow-2xl border border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('explore')}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === 'explore' ? "text-indigo-400 scale-110" : "text-gray-500"
            )}
          >
            <Compass size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Explore</span>
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === 'generate' ? "text-indigo-400 scale-110" : "text-gray-500"
            )}
          >
            <Sparkles size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Generate</span>
          </button>
        </div>
      </div>
    </>
  );
};
