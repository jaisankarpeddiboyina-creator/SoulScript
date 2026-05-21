import React from 'react';
import { Search, X, LayoutGrid, Smartphone, CheckSquare, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, SORT_OPTIONS } from '../constants';
import { cn } from '../lib/utils';
import { QuoteCategory, QuoteLength, QuoteSort } from '../types';

export const ExploreFilterGrid: React.FC = () => {
  const { 
    stagedFilters, 
    setStagedFilters, 
    applyFilters, 
    resetFilters, 
    exploreFilters,
    filteredCount,
    viewMode,
    setViewMode,
    isSelectMode,
    setIsSelectMode,
    activeTab
  } = useApp();

  if (activeTab !== 'explore') return null;

  const isFilterActive = exploreFilters.category !== 'all' || exploreFilters.search !== '' || exploreFilters.length !== 'all' || exploreFilters.sort !== 'random';
  const hasStagedChanges = JSON.stringify(stagedFilters) !== JSON.stringify(exploreFilters);

  return (
    <div className="bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-color)] p-2 md:p-5 shadow-2xl sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto space-y-2 md:space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center md:justify-between">
          {/* Main Filters Row - Aligned horizontally on tablet/desktop */}
          <div className="flex flex-col md:flex-row flex-1 gap-2.5 md:gap-4 items-stretch md:items-center min-w-0 order-2 md:order-1">
            {/* Search */}
            <div className="relative group w-full md:w-[130px] lg:w-[180px] focus-within:md:w-[155px] focus-within:lg:w-[220px] transition-all duration-300 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-400 transition-colors pointer-events-none" size={14} />
              <input
                type="text"
                placeholder="Search quotes..."
                value={stagedFilters.search}
                onChange={(e) => setStagedFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full h-11 md:h-10 pl-9 pr-8 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-sm outline-hidden focus:border-indigo-500 transition-all placeholder:text-gray-600 appearance-none"
              />
              {stagedFilters.search && (
                <button 
                  onClick={() => setStagedFilters(prev => ({ ...prev, search: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 cursor-pointer flex items-center justify-center h-8 w-8"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdowns Row - Perfect size distribution on mobile (2x2 grid) and desktop/tablet (single row) */}
            <div className="grid grid-cols-2 md:flex md:flex-1 gap-2 md:gap-3 min-w-0">
              <div className="relative flex-1 group min-w-0">
                <select 
                  value={stagedFilters.category}
                  onChange={(e) => setStagedFilters(prev => ({ ...prev, category: e.target.value as QuoteCategory }))}
                  className="w-full h-11 md:h-10 pl-3 pr-8 bg-[var(--input-bg)] hover:bg-white/5 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-[12px] font-semibold outline-hidden focus:border-indigo-500 transition-all appearance-none truncate cursor-pointer"
                >
                  <option value="all" className="bg-[var(--dropdown-bg)] text-[var(--text-primary)]">All Categories</option>
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id} className="bg-[var(--dropdown-bg)] text-[var(--text-primary)]">{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-indigo-400 transition-colors pointer-events-none" size={14} />
              </div>

              <div className="relative flex-1 group min-w-0">
                <select 
                  value={stagedFilters.length}
                  onChange={(e) => setStagedFilters(prev => ({ ...prev, length: e.target.value as QuoteLength }))}
                  className="w-full h-11 md:h-10 pl-3 pr-8 bg-[var(--input-bg)] hover:bg-white/5 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-[12px] font-semibold outline-hidden focus:border-indigo-500 transition-all appearance-none truncate cursor-pointer"
                >
                  <option value="all" className="bg-[var(--dropdown-bg)] text-[var(--text-primary)]">Any Length</option>
                  <option value="short" className="bg-[var(--dropdown-bg)] text-[var(--text-primary)]">Short</option>
                  <option value="medium" className="bg-[var(--dropdown-bg)] text-[var(--text-primary)]">Medium</option>
                  <option value="long" className="bg-[var(--dropdown-bg)] text-[var(--text-primary)]">Long</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-indigo-400 transition-colors pointer-events-none" size={14} />
              </div>

              <div className="relative flex-1 group min-w-0">
                <select 
                  value={stagedFilters.sort}
                  onChange={(e) => setStagedFilters(prev => ({ ...prev, sort: e.target.value as QuoteSort }))}
                  className="w-full h-11 md:h-10 pl-3 pr-8 bg-[var(--input-bg)] hover:bg-white/5 border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] text-[12px] font-semibold outline-hidden focus:border-indigo-500 transition-all appearance-none truncate cursor-pointer"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id} className="bg-[var(--dropdown-bg)] text-[var(--text-primary)]">{opt.label.replace('Sort: ', '')}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-indigo-400 transition-colors pointer-events-none" size={14} />
              </div>

              <button 
                onClick={applyFilters}
                className="h-11 md:h-10 px-4 md:px-5 flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-xl text-white text-[12px] font-black uppercase tracking-wider shadow-lg active:scale-95 hover:brightness-110 transition-all relative shrink-0 cursor-pointer w-full md:w-auto"
              >
                <span>Apply</span>
              </button>
            </div>
          </div>
        </div>

        {/* Info label below header on all screens */}
        <div className="flex items-center justify-between px-1 border-t border-[var(--border-color)]/50 pt-2.5 mt-1 md:border-none md:pt-0 md:mt-0">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            Showing {filteredCount} {filteredCount === 1 ? 'quote' : 'quotes'} {isFilterActive && (
              <button onClick={resetFilters} className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold decoration-dotted underline underline-offset-4 cursor-pointer">Reset</button>
            )}
          </span>

          <div className="flex gap-2 items-center">
            <button
              id="desktop-select-toggle"
              onClick={() => setIsSelectMode(!isSelectMode)}
              className={cn(
                "px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-medium",
                isSelectMode 
                  ? "bg-purple-600/20 text-purple-600 dark:bg-purple-600/30 dark:text-purple-300 ring-1 ring-purple-500/50 shadow-md" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--input-bg)]"
              )}
              title="Toggle Select Mode"
            >
              <CheckSquare size={14} className="md:w-[16px] md:h-[16px]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{isSelectMode ? 'Exit' : 'Select'}</span>
            </button>
            <div className="w-[1px] bg-[var(--border-color)] h-4 md:h-5" />
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === 'grid' 
                  ? "bg-[var(--input-bg)] text-[var(--text-primary)] font-semibold" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              title="Grid View"
            >
              <LayoutGrid size={15} className="md:w-[16px] md:h-[16px]" />
            </button>
            <button
              onClick={() => setViewMode('reels')}
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer",
                viewMode === 'reels' 
                  ? "bg-[var(--input-bg)] text-[var(--text-primary)] font-semibold" 
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
              title="Reels View"
            >
              <Smartphone size={15} className="md:w-[16px] md:h-[16px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
