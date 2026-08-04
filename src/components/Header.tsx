import React from 'react';
import { 
  Plus, 
  Grid, 
  LayoutGrid,
  Kanban, 
  List, 
  Search, 
  Volume2, 
  VolumeX, 
  Flame, 
  ArrowUpDown,
  CheckSquare,
  Square,
  Trash2,
  CheckCircle2,
  Home,
  BookOpen,
  Target,
  Edit3
} from 'lucide-react';
import { ViewMode, SortOption } from '../types';

interface HeaderProps {
  currentPage: 'overview' | 'topics';
  setCurrentPage: (page: 'overview' | 'topics') => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  soundMuted: boolean;
  setSoundMuted: (muted: boolean) => void;
  streakDays: number;
  approvedCount: number;
  totalCompletedRevisions: number;
  totalTargetRevisions: number;
  overallProgressPercent: number;
  isMultiSelectMode: boolean;
  setIsMultiSelectMode: (val: boolean) => void;
  selectedCount: number;
  onDeleteSelected: () => void;
  onMasterSelected: () => void;
  onOpenAddModal: () => void;
  onOpenStreakCalendarModal: () => void;
  onOpenReflectionModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  setCurrentPage,
  viewMode,
  setViewMode,
  sortOption,
  setSortOption,
  searchQuery,
  setSearchQuery,
  soundMuted,
  setSoundMuted,
  streakDays,
  overallProgressPercent,
  isMultiSelectMode,
  setIsMultiSelectMode,
  selectedCount,
  onDeleteSelected,
  onMasterSelected,
  onOpenAddModal,
  onOpenStreakCalendarModal,
  onOpenReflectionModal
}) => {
  const isOverview = currentPage === 'overview';

  return (
    <header 
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        isOverview 
          ? 'bg-stone-950/40 backdrop-blur-md border-b border-white/10 text-white shadow-lg px-4 py-3' 
          : 'bg-white border-b border-stone-200 text-stone-900 shadow-xs px-4 py-3'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        
        {/* App Logo & Title (Acts as Home Button) */}
        <button 
          onClick={() => setCurrentPage('overview')}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer text-left group"
          title="Go to Home (Daily Goal)"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
            <Target className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className={`text-base font-bold leading-tight tracking-tight flex items-center gap-2 ${isOverview ? 'text-white' : 'text-stone-900'}`}>
              Study Tracker
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase border ${
                isOverview 
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                  : 'bg-[#edf2e8] text-[#3b4e28] border-[#c2d4b0]'
              }`}>
                Momentum
              </span>
            </h1>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className={`flex items-center p-1 rounded-2xl border gap-1 backdrop-blur-md ${
          isOverview 
            ? 'bg-white/10 border-white/15' 
            : 'bg-[#f6f8f4] border-stone-200'
        }`}>
          <button
            onClick={() => setCurrentPage('topics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              currentPage === 'topics'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isOverview 
                  ? 'text-stone-200 hover:text-white hover:bg-white/10' 
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All Study Topics</span>
          </button>

          <button
            onClick={onOpenStreakCalendarModal}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              isOverview 
                ? 'text-stone-200 hover:text-white hover:bg-white/10' 
                : 'text-stone-600 hover:text-[#3d4d29] hover:bg-[#edf2e8]'
            }`}
            title="30-Day Activity Heatmap"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>Heatmap ({streakDays}d)</span>
          </button>
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          
          {/* Progress Indicator */}
          <div 
            className={`hidden md:flex items-center gap-1.5 border px-3 py-1.5 rounded-xl text-xs font-semibold ${
              isOverview 
                ? 'bg-white/10 border-white/15 text-stone-200' 
                : 'bg-[#f6f8f4] border-stone-200 text-stone-700'
            }`}
            title={`Overall Goal Progress: ${overallProgressPercent}%`}
          >
            <span className={isOverview ? "text-stone-300" : "text-stone-500"}>Progress:</span>
            <span className={isOverview ? "text-emerald-300 font-bold" : "text-[#3d4d29] font-bold"}>
              {overallProgressPercent}%
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isOverview 
                ? 'bg-white/10 hover:bg-white/20 text-white border-white/15' 
                : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
            }`}
            title={soundMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Add Topic Action */}
          <button
            onClick={onOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Topic</span>
          </button>
        </div>

      </div>

      {/* Topics Page Sub-Toolbar */}
      {currentPage === 'topics' && (
        <div className="max-w-6xl mx-auto mt-3 pt-2.5 border-t border-stone-200/80 flex items-center justify-between gap-3 flex-wrap">
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search study topics..."
              className="w-full bg-[#fafbfa] border border-stone-200 focus:border-[#4f6435] rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none"
            />
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#f6f8f4] p-0.5 rounded-lg border border-stone-200">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white text-[#3d4d29] shadow-xs font-semibold' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="List View (Thin & Compact)"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List (Thin)</span>
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white text-[#3d4d29] shadow-xs font-semibold' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>

              <button
                onClick={() => setViewMode('compact_grid')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'compact_grid' 
                    ? 'bg-white text-[#3d4d29] shadow-xs font-semibold' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Small Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Small Grid</span>
              </button>

              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-[#3d4d29] shadow-xs font-semibold' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Board View"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-[#fafbfa] border border-stone-200 focus:border-[#4f6435] rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:outline-none cursor-pointer"
              >
                <option value="most_revised">Most Revised</option>
                <option value="least_revised">Least Revised</option>
                <option value="newest">Recently Added</option>
                <option value="alphabetical">Alphabetical A-Z</option>
              </select>
            </div>
          </div>

          {/* Multi-Select Toggle */}
          <button
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isMultiSelectMode 
                ? 'bg-[#4f6435] border-[#4f6435] text-white' 
                : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
            }`}
          >
            {isMultiSelectMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            <span>{isMultiSelectMode ? 'Selecting' : 'Select Topics'}</span>
          </button>
        </div>
      )}

      {/* Floating Multi-Select Action Toolbar */}
      {isMultiSelectMode && currentPage === 'topics' && (
        <div className="max-w-6xl mx-auto mt-2.5 p-3 bg-[#edf2e8] rounded-2xl border border-[#c2d4b0] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#2f3d1f] flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-[#4f6435]" />
            {selectedCount} topic{selectedCount === 1 ? '' : 's'} selected
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onMasterSelected}
              disabled={selectedCount === 0}
              className="bg-[#4f6435] hover:bg-[#3f512a] disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Mastered</span>
            </button>

            <button
              onClick={onDeleteSelected}
              disabled={selectedCount === 0}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setIsMultiSelectMode(false)}
              className="text-xs font-medium text-stone-600 hover:underline px-2 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
