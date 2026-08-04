/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  subscribeToVideos, 
  addVideoProject, 
  incrementVideoRevision, 
  updateVideoProject, 
  deleteVideoProject, 
  deleteRevisionLog,
  subscribeToCategories,
  addStudyCategory,
  updateStudyCategory,
  deleteStudyCategory,
  updateCategoryOrders,
  updateVideoOrders,
} from './lib/firebase';
import { SAMPLE_VIDEOS } from './lib/sampleData';
import { calculateAchievements } from './lib/achievements';
import { soundEffects } from './lib/sound';
import { VideoProject, ViewMode, SortOption, VideoStatus, RevisionLog, DailyGoal, DailyReflection, StudyCategory } from './types';

// Components
import { Header } from './components/Header';
import { OverviewDashboard } from './components/OverviewDashboard';
import { VideoCard } from './components/VideoCard';
import { KanbanView } from './components/KanbanView';
import { ListView } from './components/ListView';
import { SmallGridView } from './components/SmallGridView';
import { AddVideoModal } from './components/AddVideoModal';
import { EditTopicModal } from './components/EditTopicModal';
import { RevisionDetailsModal } from './components/RevisionDetailsModal';
import { AchievementsModal } from './components/AchievementsModal';
import { StreakCalendarModal } from './components/StreakCalendarModal';
import { DailyReflectionModal } from './components/DailyReflectionModal';
import { EmptyState } from './components/EmptyState';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { CategorySettingsPage } from './components/CategorySettingsPage';
import { syncGoalWithReminderService } from './lib/notifications';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<'overview' | 'topics' | 'settings'>('overview');
  const [categories, setCategories] = useState<StudyCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [newTopicCategoryId, setNewTopicCategoryId] = useState('');
  const provisioningCategories = useRef(new Set<string>());

  // UI Controls State - DEFAULT TO 'list' VIEW MODE
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortOption, setSortOption] = useState<SortOption>('most_revised');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundMuted, setSoundMuted] = useState(false);

  // Multi-Select State
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);

  const handleToggleSelectVideo = (id: string) => {
    setSelectedVideoIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (!selectedVideoIds.length) return;
    try {
      soundEffects.delete(soundMuted);
      for (const id of selectedVideoIds) {
        await deleteVideoProject(id);
      }
      setSelectedVideoIds([]);
      setIsMultiSelectMode(false);
    } catch (err) {
      console.error('Failed to batch delete topics:', err);
    }
  };

  const handleMasterSelected = async () => {
    if (!selectedVideoIds.length) return;
    try {
      for (const id of selectedVideoIds) {
        await updateVideoProject(id, { status: 'mastered' });
      }
      setSelectedVideoIds([]);
      setIsMultiSelectMode(false);
      soundEffects.fanfare(soundMuted);
    } catch (err) {
      console.error('Failed to batch master topics:', err);
    }
  };

  // Compute Overall Study Goal Progress
  const totalCompletedRevisions = useMemo(() => {
    return videos.reduce((sum, v) => sum + (v.revisionCount || 0), 0);
  }, [videos]);

  const totalTargetRevisions = useMemo(() => {
    return videos.reduce((sum, v) => sum + (v.targetRevisionCount || 5), 0);
  }, [videos]);

  const overallProgressPercent = useMemo(() => {
    if (totalTargetRevisions === 0) return 0;
    return Math.min(100, Math.round((totalCompletedRevisions / totalTargetRevisions) * 100));
  }, [totalCompletedRevisions, totalTargetRevisions]);

  // Daily Goal & Reflection State (persisted per YYYY-MM-DD date)
  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();
  const [dailyGoal, setDailyGoal] = useState<DailyGoal | null>(null);
  const [dailyReflection, setDailyReflection] = useState<DailyReflection | null>(null);

  // Modals & Drawers State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEditVideo, setSelectedEditVideo] = useState<VideoProject | null>(null);
  const [selectedDetailsVideo, setSelectedDetailsVideo] = useState<VideoProject | null>(null);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isStreakCalendarOpen, setIsStreakCalendarOpen] = useState(false);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [isReminderSettingsOpen, setIsReminderSettingsOpen] = useState(false);

  // Load daily goal & reflection from LocalStorage
  useEffect(() => {
    try {
      const storedGoal = localStorage.getItem(`dailyGoal_${todayStr}`);
      if (storedGoal) {
        setDailyGoal(JSON.parse(storedGoal));
      }
      const storedReflection = localStorage.getItem(`dailyReflection_${todayStr}`);
      if (storedReflection) {
        setDailyReflection(JSON.parse(storedReflection));
      }
    } catch (e) {
      console.error('Failed to read daily state from localStorage', e);
    }
  }, [todayStr]);

  // Subscribe to Firestore Videos
  useEffect(() => {
    const unsubscribe = subscribeToVideos((updatedVideos) => {
      setVideos(updatedVideos);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => subscribeToCategories(setCategories), []);

  const smartCategories = useMemo(() => {
    const persistedNames = new Set(categories.map(category => category.name.trim().toLocaleLowerCase()));
    const automaticNames = [...new Set(videos.map(video => video.subject?.trim()).filter((name): name is string => Boolean(name)))]
      .filter(name => !persistedNames.has(name.toLocaleLowerCase()))
      .sort((a, b) => a.localeCompare(b));
    const automatic = automaticNames.map((name, index): StudyCategory => ({
      id: `auto:${encodeURIComponent(name.toLocaleLowerCase())}`,
      name,
      color: ['#667a4f', '#7a6d4f', '#4f6f7a', '#755f78', '#8a654d'][index % 5],
      orderIndex: categories.length + index,
      createdAt: '',
      updatedAt: '',
      automatic: true,
    }));
    const needsUncategorized = videos.some(video => !video.categoryId && !video.subject?.trim());
    return [...categories, ...automatic, ...(needsUncategorized ? [{ id: 'uncategorized', name: 'Uncategorized', color: '#9aa191', orderIndex: 9999, createdAt: '', updatedAt: '', automatic: true } as StudyCategory] : [])];
  }, [categories, videos]);

  const categoryForVideo = useCallback((video: VideoProject) => {
    if (video.categoryId && smartCategories.some(category => category.id === video.categoryId)) return video.categoryId;
    const byName = smartCategories.find(category => category.name.toLocaleLowerCase() === video.subject?.trim().toLocaleLowerCase());
    return byName?.id || 'uncategorized';
  }, [smartCategories]);

  // Existing subject names become persistent smart categories automatically.
  useEffect(() => {
    smartCategories.filter(category => category.automatic && category.id.startsWith('auto:')).forEach(category => {
      const key = category.name.toLocaleLowerCase();
      if (provisioningCategories.current.has(key)) return;
      provisioningCategories.current.add(key);
      void addStudyCategory(category.name, category.color, category.orderIndex).catch(() => provisioningCategories.current.delete(key));
    });
  }, [smartCategories]);

  // Compute Metrics
  const totalRevisions = useMemo(() => {
    return videos.reduce((sum, v) => sum + (v.revisionCount || 0), 0);
  }, [videos]);

  const approvedCount = useMemo(() => {
    return videos.filter(v => v.status === 'mastered').length;
  }, [videos]);

  // Compute Streak Days based on actual log timestamps
  const streakDays = useMemo(() => {
    if (!videos.length) return 0;
    const logDates = new Set<string>();
    videos.forEach(v => {
      if (v.revisionLogs) {
        v.revisionLogs.forEach(l => {
          if (l.timestamp) {
            logDates.add(l.timestamp.split('T')[0]);
          }
        });
      }
      if (v.createdAt) {
        logDates.add(v.createdAt.split('T')[0]);
      }
    });

    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (logDates.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return Math.max(streak, 1);
  }, [videos]);

  // Achievements
  const achievements = useMemo(() => {
    return calculateAchievements(videos);
  }, [videos]);

  // Daily Goal Handlers
  const handleSetDailyGoalVideo = (videoId: string) => {
    const selectedVideo = videos.find(video => video.id === videoId);
    const updatedGoal: DailyGoal = {
      dateStr: todayStr,
      videoId,
      intent: selectedVideo?.title || 'Revise today’s topic',
      targetMinutes: 45,
      status: 'not_started',
      completed: false
    };
    setDailyGoal(updatedGoal);
    localStorage.setItem(`dailyGoal_${todayStr}`, JSON.stringify(updatedGoal));
    void syncGoalWithReminderService(updatedGoal);
  };

  const handleSaveDailyGoal = (updatedGoal: DailyGoal) => {
    setDailyGoal(updatedGoal);
    localStorage.setItem(`dailyGoal_${todayStr}`, JSON.stringify(updatedGoal));
    void syncGoalWithReminderService(updatedGoal);
  };

  const handleCompleteDailyGoal = async (video?: VideoProject) => {
    try {
      soundEffects.fanfare(soundMuted);
      if (video) await handleIncrementRevision(video);
      const updatedGoal: DailyGoal = {
        ...(dailyGoal || { dateStr: todayStr, completed: false }),
        videoId: video?.id || dailyGoal?.videoId,
        status: 'completed',
        completed: true,
        completedAt: new Date().toISOString()
      };
      setDailyGoal(updatedGoal);
      localStorage.setItem(`dailyGoal_${todayStr}`, JSON.stringify(updatedGoal));
      void syncGoalWithReminderService(updatedGoal);
    } catch (err) {
      console.error('Failed to complete daily goal:', err);
    }
  };

  const handleSaveDailyReflection = (expectation: string, reality: string) => {
    const updatedReflection: DailyReflection = {
      id: `ref-${todayStr}`,
      dateStr: todayStr,
      expectation,
      reality,
      updatedAt: new Date().toISOString()
    };
    setDailyReflection(updatedReflection);
    localStorage.setItem(`dailyReflection_${todayStr}`, JSON.stringify(updatedReflection));
  };

  // Handlers for Firestore actions
  const handleAddVideo = async (newVideo: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      soundEffects.success(soundMuted);
      const newId = await addVideoProject(newVideo);
      if (!dailyGoal) {
        handleSetDailyGoalVideo(newId);
      }
    } catch (err) {
      console.error('Failed to add video:', err);
    }
  };

  const handleBatchAddVideos = async (newVideos: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      soundEffects.fanfare(soundMuted);
      for (const vid of newVideos) {
        await addVideoProject(vid);
      }
    } catch (err) {
      console.error('Failed to batch add videos:', err);
    }
  };

  const handleSaveTopic = async (videoId: string, updates: Partial<VideoProject>) => {
    try {
      soundEffects.pop(soundMuted);
      await updateVideoProject(videoId, updates);
    } catch (err) {
      console.error('Failed to update topic:', err);
    }
  };

  const handleDeleteLog = async (videoId: string, logId: string) => {
    try {
      const vObj = videos.find(v => v.id === videoId);
      if (!vObj) return;
      await deleteRevisionLog(videoId, logId, vObj.revisionLogs || []);
    } catch (err) {
      console.error('Failed to delete revision log:', err);
    }
  };

  const handleIncrementRevision = async (video: VideoProject, addedDurationSeconds?: number) => {
    try {
      await incrementVideoRevision(
        video.id, 
        video.revisionCount, 
        {
          reason: addedDurationSeconds ? `Timed Session (${Math.round(addedDurationSeconds / 60)}m)` : 'Revision +1',
          notes: addedDurationSeconds ? `Spent ${Math.round(addedDurationSeconds / 60)} minutes studying.` : 'Quick revision completed.',
          durationSeconds: addedDurationSeconds || 0
        }, 
        video.revisionLogs || [],
        addedDurationSeconds
      );
    } catch (err) {
      console.error('Failed to increment revision:', err);
    }
  };

  const handleSaveProjectTime = async (videoId: string, durationSeconds: number) => {
    try {
      const videoObj = videos.find(v => v.id === videoId);
      if (!videoObj) return;
      const currentTotal = videoObj.totalTimeSeconds || 0;
      await updateVideoProject(videoId, { totalTimeSeconds: currentTotal + durationSeconds });
    } catch (err) {
      console.error('Failed to update project time:', err);
    }
  };

  const handleIncrementWithLog = async (
    videoId: string, 
    currentCount: number, 
    logData: Omit<RevisionLog, 'id' | 'revisionNumber' | 'timestamp'>,
    existingLogs: RevisionLog[]
  ) => {
    try {
      await incrementVideoRevision(videoId, currentCount, logData, existingLogs);
      if (selectedDetailsVideo && selectedDetailsVideo.id === videoId) {
        setSelectedDetailsVideo(prev => prev ? { ...prev, revisionCount: prev.revisionCount + 1 } : null);
      }
    } catch (err) {
      console.error('Failed to log detailed revision:', err);
    }
  };

  const handleUpdateStatus = async (videoId: string, newStatus: VideoStatus) => {
    try {
      if (newStatus === 'mastered') {
        soundEffects.fanfare(soundMuted);
      } else {
        soundEffects.pop(soundMuted);
      }
      await updateVideoProject(videoId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await deleteVideoProject(videoId);
      if (selectedDetailsVideo?.id === videoId) {
        setSelectedDetailsVideo(null);
      }
    } catch (err) {
      console.error('Failed to delete video:', err);
    }
  };

  const handleLoadSampleData = async () => {
    try {
      soundEffects.success(soundMuted);
      for (const sample of SAMPLE_VIDEOS) {
        await addVideoProject(sample);
      }
    } catch (err) {
      console.error('Failed to load sample data:', err);
    }
  };

  // Filter and Sort Videos
  const filteredAndSortedVideos = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase();
    const searchableText = (value: unknown) => String(value ?? '').toLocaleLowerCase();

    let result = videos.filter(v => {
      if (!q) return true;

      return (
        searchableText(v.title).includes(q) ||
        searchableText(v.subject).includes(q) ||
        (Array.isArray(v.tags) && v.tags.some(tag => searchableText(tag).includes(q))) ||
        searchableText(v.notes).includes(q)
      );
    });

    switch (sortOption) {
      case 'most_revised':
        result.sort((a, b) => b.revisionCount - a.revisionCount);
        break;
      case 'least_revised':
        result.sort((a, b) => a.revisionCount - b.revisionCount);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [videos, searchQuery, sortOption]);

  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans selection:bg-[#4d5f38] selection:text-white bg-[#fbfcf9] overflow-x-hidden">

      {/* Header Navigation */}
      <Header
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortOption={sortOption}
        setSortOption={setSortOption}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        soundMuted={soundMuted}
        setSoundMuted={setSoundMuted}
        streakDays={streakDays}
        approvedCount={approvedCount}
        totalCompletedRevisions={totalCompletedRevisions}
        totalTargetRevisions={totalTargetRevisions}
        overallProgressPercent={overallProgressPercent}
        isMultiSelectMode={isMultiSelectMode}
        setIsMultiSelectMode={setIsMultiSelectMode}
        selectedCount={selectedVideoIds.length}
        onDeleteSelected={handleDeleteSelected}
        onMasterSelected={handleMasterSelected}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenStreakCalendarModal={() => setIsStreakCalendarOpen(true)}
        onOpenReflectionModal={() => setIsReflectionModalOpen(true)}
        onOpenReminderSettings={() => setIsReminderSettingsOpen(true)}
      />

      {/* Main Content View Container */}
      <main className={`flex-1 w-full relative z-10 ${
        currentPage === 'overview' ? 'flex flex-col' : 'max-w-6xl mx-auto px-4 lg:px-6 pt-8 min-h-[calc(100vh-80px)]'
      }`}>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-[#59634f]">
            <div className="w-7 h-7 border-2 border-[#4d5f38] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="font-medium text-xs">Preparing today…</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.99 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="w-full flex-1 flex flex-col"
            >
              {currentPage === 'overview' ? (
                /* PAGE 1: Momentum Dashboard with ONLY Daily Goal */
                <OverviewDashboard
                  videos={videos}
                  dailyGoal={dailyGoal}
                  streakDays={streakDays}
                  onNavigateToTopics={() => setCurrentPage('topics')}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onSaveDailyGoal={handleSaveDailyGoal}
                  onCompleteDailyGoal={handleCompleteDailyGoal}
                />
              ) : (
                /* PAGE 2: All Study Topics Catalog */
                <div className="pb-16 space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-stone-900">All Study Topics ({filteredAndSortedVideos.length})</h2>
                      <p className="text-xs text-stone-500">
                        Manage topics, track revisions, and monitor practice sessions
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-[#4f6435] hover:bg-[#3f512a] text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      + Add Topic
                    </button>
                  </div>

                  {filteredAndSortedVideos.length === 0 ? (
                    <EmptyState
                      onOpenAddModal={() => setIsAddModalOpen(true)}
                      onLoadSampleData={handleLoadSampleData}
                    />
                  ) : (
                    <div>
                      {viewMode === 'list' && (
                        <ListView
                          videos={filteredAndSortedVideos}
                          isMultiSelectMode={isMultiSelectMode}
                          selectedVideoIds={selectedVideoIds}
                          onToggleSelect={handleToggleSelectVideo}
                          onIncrementRevision={handleIncrementRevision}
                          onDeleteVideo={handleDeleteVideo}
                          onUpdateStatus={handleUpdateStatus}
                          onOpenDetails={(v) => setSelectedDetailsVideo(v)}
                          soundMuted={soundMuted}
                        />
                      )}

                      {viewMode === 'compact_grid' && (
                        <SmallGridView
                          videos={filteredAndSortedVideos}
                          isMultiSelectMode={isMultiSelectMode}
                          selectedVideoIds={selectedVideoIds}
                          onToggleSelect={handleToggleSelectVideo}
                          onIncrementRevision={handleIncrementRevision}
                          onDeleteVideo={handleDeleteVideo}
                          onUpdateStatus={handleUpdateStatus}
                          onOpenDetails={(v) => setSelectedDetailsVideo(v)}
                          soundMuted={soundMuted}
                        />
                      )}

                      {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          <AnimatePresence>
                            {filteredAndSortedVideos.map((video) => (
                              <VideoCard
                                key={video.id}
                                video={video}
                                isDailyGoalVideo={dailyGoal?.videoId === video.id}
                                isMultiSelectMode={isMultiSelectMode}
                                isSelected={selectedVideoIds.includes(video.id)}
                                onToggleSelect={handleToggleSelectVideo}
                                onIncrementRevision={handleIncrementRevision}
                                onDeleteVideo={handleDeleteVideo}
                                onUpdateStatus={handleUpdateStatus}
                                onOpenDetails={(v) => setSelectedDetailsVideo(v)}
                                onOpenEditModal={(v) => setSelectedEditVideo(v)}
                                onSetDailyGoalVideo={handleSetDailyGoalVideo}
                                onSaveProjectTime={handleSaveProjectTime}
                                onSaveQuickNote={(videoId, notes) => handleSaveTopic(videoId, { notes })}
                                soundMuted={soundMuted}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      )}

                      {viewMode === 'kanban' && (
                        <KanbanView
                          videos={filteredAndSortedVideos}
                          onIncrementRevision={handleIncrementRevision}
                          onDeleteVideo={handleDeleteVideo}
                          onUpdateStatus={handleUpdateStatus}
                          onOpenDetails={(v) => setSelectedDetailsVideo(v)}
                          onOpenAddModal={() => setIsAddModalOpen(true)}
                          soundMuted={soundMuted}
                        />
                      )}
                    </div>
                  )}

                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

      </main>

      {/* Modals */}
      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddVideo={handleAddVideo}
        onBatchAddVideos={handleBatchAddVideos}
      />

      <EditTopicModal
        video={selectedEditVideo}
        isOpen={!!selectedEditVideo}
        onClose={() => setSelectedEditVideo(null)}
        onSaveTopic={handleSaveTopic}
        onDeleteTopic={handleDeleteVideo}
        soundMuted={soundMuted}
      />

      <RevisionDetailsModal
        video={selectedDetailsVideo}
        isOpen={!!selectedDetailsVideo}
        onClose={() => setSelectedDetailsVideo(null)}
        onIncrementRevisionWithLog={handleIncrementWithLog}
        onDeleteLog={handleDeleteLog}
        onSaveProjectTime={handleSaveProjectTime}
        soundMuted={soundMuted}
      />

      <AchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        achievements={achievements}
        streakDays={streakDays}
        totalRevisions={totalRevisions}
        totalApproved={approvedCount}
      />

      <StreakCalendarModal
        isOpen={isStreakCalendarOpen}
        onClose={() => setIsStreakCalendarOpen(false)}
        videos={videos}
        streakDays={streakDays}
        dailyReflection={dailyReflection}
        onSaveDailyReflection={handleSaveDailyReflection}
        soundMuted={soundMuted}
      />

      <DailyReflectionModal
        isOpen={isReflectionModalOpen}
        onClose={() => setIsReflectionModalOpen(false)}
        dailyReflection={dailyReflection}
        onSaveDailyReflection={handleSaveDailyReflection}
      />

      <ReminderSettingsModal
        isOpen={isReminderSettingsOpen}
        onClose={() => setIsReminderSettingsOpen(false)}
        dailyGoal={dailyGoal}
      />

    </div>
  );
}
