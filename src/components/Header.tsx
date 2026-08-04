import React from 'react';
import { Bell, BookOpen, Grid, Home, Kanban, LayoutGrid, List, Plus, Search, Target, X } from 'lucide-react';
import { SortOption, ViewMode } from '../types';

interface HeaderProps {
  currentPage: 'overview' | 'topics';
  setCurrentPage: (page: 'overview' | 'topics') => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenReminderSettings: () => void;
  [key: string]: unknown;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, viewMode, setViewMode, sortOption, setSortOption, searchQuery, setSearchQuery, onOpenAddModal, onOpenReminderSettings }) => (
  <header className="sticky top-0 z-30 bg-[#fbfcf9]/90 backdrop-blur-xl border-b border-[#e7eae2]">
    <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
      <button onClick={() => setCurrentPage('overview')} className="flex items-center gap-2.5 text-left">
        <span className="w-8 h-8 rounded-xl bg-[#4d5f38] text-white flex items-center justify-center"><Target className="w-4 h-4" /></span>
        <span className="font-semibold tracking-[-0.02em] text-[#23291f]">Rewise</span>
      </button>

      <nav className="flex items-center gap-1 p-1 rounded-xl bg-[#f1f4ed]">
        <button onClick={() => setCurrentPage('overview')} className={`nav-button ${currentPage === 'overview' ? 'nav-active' : ''}`}><Home className="w-4 h-4" /><span className="hidden sm:inline">Today</span></button>
        <button onClick={() => setCurrentPage('topics')} className={`nav-button ${currentPage === 'topics' ? 'nav-active' : ''}`}><BookOpen className="w-4 h-4" /><span className="hidden sm:inline">Topics</span></button>
      </nav>

      <div className="flex items-center gap-1.5">
        <button onClick={onOpenReminderSettings} className="icon-button" title="Reminder settings"><Bell className="w-4 h-4" /></button>
        <button onClick={onOpenAddModal} className="icon-button" title="Add topic"><Plus className="w-4 h-4" /></button>
      </div>
    </div>

    {currentPage === 'topics' && (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3 flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa191] pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search topics, subjects, tags, or notes"
            aria-label="Search topics"
            className="focus-input search-input py-2"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#7c8574] hover:text-[#30372b] hover:bg-[#e9ede5] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select value={sortOption} onChange={e => setSortOption(e.target.value as SortOption)} className="focus-input py-2 w-auto hidden sm:block">
          <option value="most_revised">Most revised</option><option value="least_revised">Needs revision</option><option value="newest">Newest</option><option value="alphabetical">A–Z</option>
        </select>
        <div className="hidden md:flex items-center gap-1">
          {([['list', List], ['grid', Grid], ['compact_grid', LayoutGrid], ['kanban', Kanban]] as const).map(([mode, Icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)} className={`icon-button ${viewMode === mode ? 'bg-[#e5ebdf] text-[#40502f]' : ''}`}><Icon className="w-4 h-4" /></button>
          ))}
        </div>
      </div>
    )}
  </header>
);
