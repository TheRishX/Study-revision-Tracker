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
} from './lib/localStore';
import { SAMPLE_VIDEOS } from './lib/sampleData';
import { calculateAchievements } from './lib/achievements';
import { soundEffects } from './lib/sound';
import { VideoProject, ViewMode, SortOption, VideoStatus, RevisionLog, DailyGoal, DailyReflection, StudyCategory, ThemePreference } from './types';

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
import { TodoWidget } from './components/TodoWidget';
import { syncGoalWithReminderService } from './lib/notifications';
import { playSelectedAlarmSound } from './lib/alarmSound';
import { motion, AnimatePresence } from 'motion/react';

const MAJOR_CATEGORIES = [
  { name: 'HTML', color: '#a76343', keywords: ['html', 'html5', 'semantic html', 'accessibility', 'a11y', 'web forms'] },
  { name: 'CSS', color: '#4f7188', keywords: ['css', 'css3', 'sass', 'scss', 'tailwind', 'bootstrap', 'flexbox', 'css grid', 'responsive design'] },
  { name: 'JavaScript', color: '#9a8237', keywords: ['javascript', 'js', 'ecmascript', 'es6', 'dom', 'promise', 'async await', 'closure'] },
  { name: 'TypeScript', color: '#47729a', keywords: ['typescript', 'type script', 'ts', 'types', 'interfaces', 'generics'] },
  { name: 'React', color: '#4e8790', keywords: ['react', 'react.js', 'jsx', 'hooks', 'useeffect', 'usestate', 'redux', 'context api', 'nextjs', 'next.js'] },
  { name: 'Node.js', color: '#587846', keywords: ['node', 'nodejs', 'node.js', 'npm', 'event loop', 'streams', 'backend javascript'] },
  { name: 'Express', color: '#60685a', keywords: ['express', 'middleware', 'routing', 'rest api', 'controller', 'jwt', 'authentication'] },
  { name: 'MongoDB', color: '#4d7d56', keywords: ['mongodb', 'mongo', 'mongoose', 'aggregation', 'nosql', 'database schema'] },
  { name: 'MERN Projects', color: '#657346', keywords: ['mern', 'full stack', 'fullstack', 'portfolio project'] },
  { name: 'Testing', color: '#795f82', keywords: ['testing', 'unit test', 'integration test', 'jest', 'vitest', 'cypress', 'playwright'] },
  { name: 'Git & GitHub', color: '#695f58', keywords: ['git', 'github', 'version control', 'pull request', 'branching', 'merge conflict'] },
  { name: 'Deployment & DevOps', color: '#596e78', keywords: ['deployment', 'deploy', 'devops', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'vercel', 'netlify', 'ci cd', 'github actions', 'nginx', 'cloud', 'cloud run'] },
  { name: 'AI & LLMs', color: '#765f85', keywords: ['ai', 'artificial intelligence', 'generative ai', 'machine learning', 'llm', 'openai', 'gemini', 'rag', 'embedding', 'prompt engineering', 'ai agent', 'chatbot'] },
  { name: 'Data Structures & Algorithms', color: '#7b6549', keywords: ['data structure', 'algorithm', 'dsa', 'leetcode', 'dynamic programming', 'graph', 'tree', 'sorting algorithm'] },
  { name: 'System Design', color: '#526b67', keywords: ['system design', 'scalability', 'distributed system', 'caching', 'load balancer', 'microservices', 'message queue'] },
] as const;

export default function App() {
  const [videos, setVideos] = useState<VideoProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<'overview' | 'topics' | 'settings'>('overview');
  const [categories, setCategories] = useState<StudyCategory[]>([]);

  // The web build uses a page service worker for push. Chrome extension pages
  // are managed by the MV3 background worker instead.
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.id) return;
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'REMINDER_RECEIVED' && document.visibilityState === 'visible') {
        void playSelectedAlarmSound().catch(() => {});
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [newTopicCategoryId, setNewTopicCategoryId] = useState('');
  const seedingCategories = useRef(new Set<string>());

  // UI Controls State - DEFAULT TO 'list' VIEW MODE
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortOption, setSortOption] = useState<SortOption>('most_revised');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundMuted, setSoundMuted] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => (localStorage.getItem('rewise-theme') as ThemePreference) || 'system');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolved = themePreference === 'system' ? (media.matches ? 'dark' : 'light') : themePreference;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };
    applyTheme();
    localStorage.setItem('rewise-theme', themePreference);
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [themePreference]);

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

  useEffect(() => subscribeToCategories(updatedCategories => {
    setCategories(updatedCategories);
    setCategoriesLoaded(true);
  }), []);

  const smartCategories = useMemo(() => {
    return [...categories, { id: 'uncategorized', name: 'Uncategorized', color: '#9aa191', keywords: [], orderIndex: 9999, createdAt: '', updatedAt: '', automatic: true } as StudyCategory];
  }, [categories]);

  const categoryForVideo = useCallback((video: VideoProject) => {
    if (video.categorySource === 'manual' && video.categoryId && categories.some(category => category.id === video.categoryId)) return video.categoryId;
    const normalize = (value: string) => ` ${value.toLocaleLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').replace(/\s+/g, ' ').trim()} `;
    const searchable = normalize([video.title, video.subject, video.tags?.join(' '), video.notes].filter(Boolean).join(' '));
    let bestCategory: StudyCategory | undefined;
    let bestScore = 0;
    categories.forEach(category => {
      const keywords = category.keywords?.length ? category.keywords : [category.name];
      const normalizedName = normalize(category.name).trim();
      const nameScore = normalizedName && searchable.includes(` ${normalizedName} `) ? 3 : 0;
      const score = nameScore + keywords.reduce((total, keyword) => {
        const normalizedKeyword = normalize(keyword).trim();
        return total + (normalizedKeyword && searchable.includes(` ${normalizedKeyword} `) ? Math.max(1, normalizedKeyword.split(' ').length) : 0);
      }, 0);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    });
    return bestCategory?.id || 'uncategorized';
  }, [categories]);

  useEffect(() => {
    if (selectedCategoryId !== 'all' && !smartCategories.some(category => category.id === selectedCategoryId)) {
      setSelectedCategoryId('all');
    }
  }, [selectedCategoryId, smartCategories]);

  // Seed a deliberate curriculum. Topic/video names never become categories.
  useEffect(() => {
    if (!categoriesLoaded) return;
    const existingNames = new Set(categories.map(category => category.name.toLocaleLowerCase()));
    MAJOR_CATEGORIES.forEach((category, index) => {
      const key = category.name.toLocaleLowerCase();
      const existing = categories.find(item => item.name.toLocaleLowerCase() === key);
      if (existing && !existing.keywords.length && !seedingCategories.current.has(`upgrade:${key}`)) {
        seedingCategories.current.add(`upgrade:${key}`);
        void updateStudyCategory(existing.id, { keywords: [...category.keywords] });
      }
      if (existingNames.has(key) || seedingCategories.current.has(key)) return;
      seedingCategories.current.add(key);
      void addStudyCategory(category.name, category.color, index, [...category.keywords]).catch(() => seedingCategories.current.delete(key));
    });
  }, [categories, categoriesLoaded]);

  // Smart topics are reclassified whenever their text or category keywords change.
  useEffect(() => {
    if (!categoriesLoaded || !categories.length) return;
    videos.filter(video => video.categorySource !== 'manual').forEach(video => {
      const predictedId = categoryForVideo(video);
      const storedId = predictedId === 'uncategorized' ? '' : predictedId;
      if (video.categoryId === storedId && video.categorySource === 'smart') return;
      void updateVideoProject(video.id, { categoryId: storedId, categorySource: 'smart' });
    });
  }, [videos, categories, categoriesLoaded, categoryForVideo]);

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

  const handleChangeDailyGoal = () => {
    setDailyGoal(null);
    localStorage.removeItem(`dailyGoal_${todayStr}`);
    localStorage.removeItem(`focusTimer_${todayStr}`);
    void syncGoalWithReminderService(null);
    setCurrentPage('overview');
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

  const handleCreateCategory = async (name: string, color: string, keywords: string[]) => {
    if (smartCategories.some(category => category.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return;
    await addStudyCategory(name, color, smartCategories.length, keywords);
  };

  const handleUpdateCategory = async (category: StudyCategory, name: string, color: string, keywords: string[]) => {
    if (category.automatic) return;
    await updateStudyCategory(category.id, { name, color, keywords });
  };

  const handleDeleteCategory = async (category: StudyCategory) => {
    const affected = videos.filter(video => categoryForVideo(video) === category.id);
    await Promise.all(affected.map(video => updateVideoProject(video.id, { categoryId: '', categorySource: 'smart' })));
    if (!category.automatic) await deleteStudyCategory(category.id);
    if (selectedCategoryId === category.id) setSelectedCategoryId('all');
  };

  const handleReorderCategories = async (draggedId: string, targetId: string) => {
    const reordered = [...smartCategories];
    const from = reordered.findIndex(category => category.id === draggedId);
    const to = reordered.findIndex(category => category.id === targetId);
    if (from < 0 || to < 0) return;
    const [dragged] = reordered.splice(from, 1);
    reordered.splice(to, 0, dragged);
    await updateCategoryOrders(reordered);
  };

  const handleAssignTopic = async (video: VideoProject, category: StudyCategory) => {
    await updateVideoProject(video.id, {
      categoryId: category.automatic ? '' : category.id,
      categorySource: category.id === 'uncategorized' ? 'smart' : 'manual',
    });
  };

  const handleReorderTopics = async (categoryId: string, draggedId: string, targetId: string) => {
    const dragged = videos.find(video => video.id === draggedId);
    const category = smartCategories.find(item => item.id === categoryId);
    if (!dragged || !category) return;
    if (categoryForVideo(dragged) !== categoryId) await handleAssignTopic(dragged, category);
    const reordered = [...videos].sort((a, b) => a.orderIndex - b.orderIndex).filter(video => video.id !== draggedId);
    const targetIndex = reordered.findIndex(video => video.id === targetId);
    reordered.splice(targetIndex < 0 ? reordered.length : targetIndex, 0, dragged);
    await updateVideoOrders(reordered);
    setSortOption('manual');
  };

  // Filter and Sort Videos
  const filteredAndSortedVideos = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase();
    const searchableText = (value: unknown) => String(value ?? '').toLocaleLowerCase();

    let result = videos.filter(v => {
      if (selectedCategoryId !== 'all' && categoryForVideo(v) !== selectedCategoryId) return false;
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
      case 'numbering':
        result.sort((a, b) => a.orderIndex - b.orderIndex || a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [videos, searchQuery, sortOption, selectedCategoryId, categoryForVideo]);

  return (
    <div className={`app-shell relative w-full flex flex-col font-sans selection:bg-[#4d5f38] selection:text-white overflow-x-hidden ${
      currentPage === 'overview' ? 'h-[100dvh] overflow-y-hidden' : 'min-h-screen'
    }`}>

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
        onOpenSettings={() => setCurrentPage('settings')}
      />

      {/* Main Content View Container */}
      <main className={`flex-1 w-full relative z-10 ${
        currentPage === 'overview' ? 'flex flex-col' : currentPage === 'settings' ? '' : 'max-w-6xl mx-auto px-4 lg:px-6 pt-8 min-h-[calc(100vh-80px)]'
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
              ) : currentPage === 'settings' ? (
                <CategorySettingsPage
                  categories={smartCategories}
                  videos={videos}
                  categoryForVideo={categoryForVideo}
                  onCreateCategory={handleCreateCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onReorderCategories={handleReorderCategories}
                  onAssignTopic={handleAssignTopic}
                  onReorderTopics={handleReorderTopics}
                  onAddTopic={(category) => { setNewTopicCategoryId(category.id); setIsAddModalOpen(true); }}
                  themePreference={themePreference}
                  onThemeChange={setThemePreference}
                  dailyGoal={dailyGoal}
                  onChangeDailyGoal={handleChangeDailyGoal}
                />
              ) : (
                /* PAGE 2: All Study Topics Catalog */
                <div className="pb-16 space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-stone-900">{selectedCategoryId === 'all' ? 'All Study Topics' : smartCategories.find(category => category.id === selectedCategoryId)?.name || 'Topics'} ({filteredAndSortedVideos.length})</h2>
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

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                    <button onClick={() => setSelectedCategoryId('all')} className={`category-filter ${selectedCategoryId === 'all' ? 'category-filter-active' : ''}`}>
                      All topics <span>{videos.length}</span>
                    </button>
                    {smartCategories.map(category => {
                      const count = videos.filter(video => categoryForVideo(video) === category.id).length;
                      return (
                        <button key={category.id} onClick={() => setSelectedCategoryId(category.id)} className={`category-filter ${selectedCategoryId === category.id ? 'category-filter-active' : ''}`}>
                          <i style={{ background: category.color }} /> {category.name} <span>{count}</span>
                        </button>
                      );
                    })}
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
                          categories={smartCategories}
                          categoryForVideo={categoryForVideo}
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
                                onSetDailyGoalVideo={dailyGoal ? undefined : handleSetDailyGoalVideo}
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

      {currentPage === 'overview' && <TodoWidget soundMuted={soundMuted} />}

      {/* Modals */}
      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setNewTopicCategoryId(''); }}
        onAddVideo={handleAddVideo}
        onBatchAddVideos={handleBatchAddVideos}
        categories={smartCategories}
        initialCategoryId={newTopicCategoryId}
      />

      <EditTopicModal
        video={selectedEditVideo}
        isOpen={!!selectedEditVideo}
        onClose={() => setSelectedEditVideo(null)}
        onSaveTopic={handleSaveTopic}
        onDeleteTopic={handleDeleteVideo}
        soundMuted={soundMuted}
        categories={smartCategories}
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
