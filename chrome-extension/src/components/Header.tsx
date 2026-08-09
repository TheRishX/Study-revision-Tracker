import React from 'react';
import { Bell, CalendarClock, CalendarDays, BookMarked, Grid, Home, Kanban, LayoutGrid, List, Newspaper, Plus, Search, Settings, Target, X } from 'lucide-react';
import { SortOption, ViewMode } from '../types';

interface HeaderProps {
  currentPage: 'overview' | 'topics' | 'guide' | 'tomorrow' | 'settings' | 'blogs';
  setCurrentPage: (page: 'overview' | 'topics' | 'guide' | 'tomorrow' | 'settings' | 'blogs') => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAddModal: () => void;
  onOpenReminderSettings: () => void;
  onOpenSettings: () => void;
  onOpenStreakCalendarModal: () => void;
  [key: string]: unknown;
}

const LionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M7.2 6.2 4.8 4.8l-.2 3.4A8.2 8.2 0 0 0 3.8 12c0 4.7 3.7 8.4 8.2 8.4s8.2-3.7 8.2-8.4c0-1.4-.3-2.7-.9-3.8l-.2-3.4-2.4 1.4" />
    <path d="M7.4 9.2c1-1 2.6-1.6 4.6-1.6s3.6.6 4.6 1.6v4.1c0 2.7-2 4.8-4.6 4.8s-4.6-2.1-4.6-4.8V9.2Z" />
    <path d="M9.2 11.4h.1M14.7 11.4h.1M10.4 14.2 12 15l1.6-.8M12 15v1.2" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, viewMode, setViewMode, sortOption, setSortOption, searchQuery, setSearchQuery, onOpenAddModal, onOpenReminderSettings, onOpenSettings, onOpenStreakCalendarModal }) => (
  <header className={`app-header sticky top-0 z-30 shrink-0 backdrop-blur-xl border-b ${currentPage === 'overview' ? 'momentum-header' : ''}`}>
    <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
      <button onClick={() => setCurrentPage('overview')} className="flex items-center gap-2.5 text-left">
        <span className="w-8 h-8 rounded-xl bg-[#4d5f38] text-white flex items-center justify-center"><Target className="w-4 h-4" /></span>
        <span className="app-brand font-semibold tracking-[-0.02em]">Rewise</span>
      </button>

      <nav className="app-nav flex items-center gap-1 p-1 rounded-xl">
        <button onClick={() => setCurrentPage('overview')} className={`nav-button ${currentPage === 'overview' ? 'nav-active' : ''}`}><Home className="w-4 h-4" /><span className="hidden sm:inline">Today</span></button>
        <button onClick={() => setCurrentPage('topics')} className={`nav-button ${currentPage === 'topics' ? 'nav-active' : ''}`}><LionIcon className="w-4 h-4" /><span className="hidden sm:inline">Sheryians ReWise</span></button>
        <button onClick={() => setCurrentPage('guide')} className={`nav-button ${currentPage === 'guide' ? 'nav-active' : ''}`}><BookMarked className="w-4 h-4" /><span className="hidden sm:inline">Topic Tracker</span></button>
        <button onClick={() => setCurrentPage('tomorrow')} className={`nav-button ${currentPage === 'tomorrow' ? 'nav-active' : ''}`}><CalendarClock className="w-4 h-4" /><span className="hidden sm:inline">Tomorrow</span></button>
        <button onClick={() => setCurrentPage('blogs')} className={`nav-button ${currentPage === 'blogs' ? 'nav-active' : ''}`}><Newspaper className="w-4 h-4" /><span className="hidden sm:inline">Blogs</span></button>
      </nav>

      <div className="flex items-center gap-1.5">
        <button onClick={onOpenStreakCalendarModal} className="icon-button" title="Activity calendar and heatmap"><CalendarDays className="w-4 h-4" /></button>
        <button onClick={onOpenReminderSettings} className="icon-button" title="Reminder settings"><Bell className="w-4 h-4" /></button>
        <button onClick={onOpenSettings} className={`icon-button ${currentPage === 'settings' ? 'bg-[#e5ebdf] text-[#40502f]' : ''}`} title="Category settings"><Settings className="w-4 h-4" /></button>
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
        <select value={sortOption} onChange={e => setSortOption(e.target.value as SortOption)} aria-label="Sort topics" className="focus-input py-2 !w-[132px] hidden sm:block">
          <option value="numbering">Number order</option><option value="most_revised">Most revised</option><option value="least_revised">Least revised</option><option value="newest">Newest</option><option value="alphabetical">A–Z</option>
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
