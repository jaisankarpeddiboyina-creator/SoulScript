import React from 'react';
import { Search, X, LayoutGrid, Smartphone, CheckSquare } from 'lucide-react';
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
    <div className="bg-[var(--bg-primary)]/95 backdrop-blur-xl border-b border-[var(--border-color)] p-3 md:p-4 shadow-2xl">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="grid grid-cols-2 md:flex md:flex-row gap-2.5">
          {/* Row 1/Col 1: Search */}
          <div className="relative group col-span-1 md:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none" size={16} />
            <input
              type="text"
              placeholder="Search quotes..."
              value={stagedFilters.search}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full h-12 pl-11 pr-10 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[10px] text-[var(--text-primary)] text-sm outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder:text-gray-600 appearance-none"
            />
            {stagedFilters.search && (
              <button 
                onClick={() => setStagedFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Row 1/Col 2 & Row 2: Selects */}
          <div className="relative col-span-1 md:w-48 group">
            <select 
              value={stagedFilters.category}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, category: e.target.value as QuoteCategory }))}
              className="w-full h-12 px-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[10px] text-[var(--text-primary)] text-sm outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none pr-10"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors">▾</div>
          </div>

          <div className="relative col-span-1 md:w-36 group">
            <select 
              value={stagedFilters.length}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, length: e.target.value as QuoteLength }))}
              className="w-full h-12 px-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[10px] text-[var(--text-primary)] text-sm outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none pr-10"
            >
              <option value="all">Any Length</option>
              <option value="short">Short (&lt; 80 chars)</option>
              <option value="medium">Medium (80–180 chars)</option>
              <option value="long">Long (&gt; 180 chars)</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors">▾</div>
          </div>

          <div className="relative col-span-1 md:w-40 group">
            <select 
              value={stagedFilters.sort}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, sort: e.target.value as QuoteSort }))}
              className="w-full h-12 px-4 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-[10px] text-[var(--text-primary)] text-sm outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none pr-10"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label.includes('Sort:') ? opt.label : `Sort: ${opt.label}`}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-white transition-colors">▾</div>
          </div>

          {/* Row 3/Col 2: Apply Button */}
          <div className="col-span-1 md:w-auto md:flex-shrink-0">
            <button 
              onClick={applyFilters}
              className="w-full h-12 px-6 flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-600 to-pink-600 rounded-[10px] text-white text-sm font-bold shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all relative cursor-pointer"
            >
              <span>🎨 Apply Filters</span>
              {hasStagedChanges && (
                <span className="w-2 h-2 bg-white rounded-full animate-pulse absolute -top-1 -right-1 shadow-sm" />
              )}
            </button>
          </div>

          {/* View Mode Toggle (Mobile only) */}
          <div className="flex bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--border-color)] md:hidden col-span-2 justify-between">
            <button
              onClick={() => setIsSelectMode(!isSelectMode)}
              className={cn(
                "flex-1 flex items-center justify-center py-2 rounded-lg transition-all gap-2",
                isSelectMode ? "bg-purple-600/30 text-purple-300 ring-1 ring-purple-500/50" : "text-white/40 hover:text-white"
              )}
            >
              <CheckSquare size={18} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{isSelectMode ? 'On' : 'Select'}</span>
            </button>
            <div className="w-[1px] bg-[var(--border-color)] my-1 mx-1" />
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex-1 flex justify-center py-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white/10 text-[var(--text-primary)]" : "text-gray-500"
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('reels')}
              className={cn(
                "flex-1 flex justify-center py-2 rounded-lg transition-all",
                viewMode === 'reels' ? "bg-white/10 text-[var(--text-primary)]" : "text-gray-500"
              )}
            >
              <Smartphone size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">
            Showing {filteredCount} quotes {isFilterActive && (
              <button onClick={resetFilters} className="ml-2 text-indigo-400 hover:text-indigo-300 font-bold decoration-dotted underline underline-offset-4 cursor-pointer">Reset</button>
            )}
          </span>
          
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => setIsSelectMode(!isSelectMode)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                isSelectMode ? "bg-purple-600/30 text-purple-300 ring-1 ring-purple-500/50 shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
              title="Toggle Select Mode"
            >
              <CheckSquare size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-white/10 text-[var(--text-primary)]" : "text-gray-500 hover:text-[var(--text-primary)]"
              )}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('reels')}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'reels' ? "bg-white/10 text-[var(--text-primary)]" : "text-gray-500 hover:text-[var(--text-primary)]"
              )}
              title="Reels View"
            >
              <Smartphone size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
