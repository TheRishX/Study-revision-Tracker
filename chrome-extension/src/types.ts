export type VideoStatus = 'not_started' | 'in_progress' | 'revision_due' | 'mastered' | 'on_hold';

export type RevisionReason = 
  | 'First Watch 📺' 
  | 'Quick Recap ⚡' 
  | 'Practice Problems 📝' 
  | 'Formula & Concept Review 🧠' 
  | 'Active Recall & Test 🎯' 
  | 'Deep Dive 🔍' 
  | 'Pre-Exam Polish 🎓';

export interface RevisionLog {
  id: string;
  revisionNumber: number;
  reason?: string;
  notes?: string;
  durationSeconds?: number; // Time spent on this study session in seconds
  timestamp: string; // ISO string
}

export interface VideoProject {
  id: string;
  title: string;
  subject?: string;
  categoryId?: string;
  categorySource?: 'manual' | 'smart';
  clientName?: string; // Kept optional for backward compatibility
  revisionCount: number;
  targetRevisionCount?: number; // Target revision limit e.g. 5
  totalTimeSeconds?: number;     // Accumulated duration in seconds across revision rounds
  status: VideoStatus;
  tags: string[];
  deadline?: string; // Target exam date or deadline
  notes?: string;
  orderIndex: number;
  revisionLogs?: RevisionLog[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyCategory {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  automatic?: boolean;
}

export interface MainTopic {
  id: string;
  name: string;
  category: string;
  parentId?: string;
  usedFor: string;
  completed: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface MainTopicCategory {
  id: string;
  name: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'grid' | 'compact_grid' | 'kanban' | 'list';
export type ThemePreference = 'light' | 'dark' | 'system';

export type SortOption = 
  | 'most_revised' 
  | 'least_revised' 
  | 'newest' 
  | 'oldest' 
  | 'alphabetical' 
  | 'numbering'
  | 'manual';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface UserStats {
  totalRevisionsCount: number;
  totalProjectsCount: number;
  approvedProjectsCount: number;
  currentStreakDays: number;
  lastActiveDate: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface DailyGoal {
  dateStr: string; // YYYY-MM-DD
  videoId?: string; // Optional linked revision topic
  intent?: string; // The concrete outcome for today
  targetMinutes?: number;
  status?: 'not_started' | 'learning' | 'paused' | 'completed';
  lastCheckInAt?: string;
  completed: boolean; // Has it been revised/completed today?
  completedAt?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  morningTime: string;
  repeatMinutes: number;
  checkInMinutes: number;
  quietTime: string;
  timezone: string;
  /** The selected file is stored only on this device, never uploaded. */
  alarmSoundName?: string;
}

export interface DailyReflection {
  id: string;
  dateStr: string; // YYYY-MM-DD
  expectation: string; // What I thought I would achieve today
  reality: string;     // What I actually achieved today
  updatedAt: string;
}
