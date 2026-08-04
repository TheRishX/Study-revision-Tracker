import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  CheckCircle2, 
  Plus, 
  Flame, 
  ArrowRight, 
  Clock, 
  BookOpen,
  Timer,
  Check,
  Sparkles,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { VideoProject, DailyGoal } from '../types';
import { RevisionTimer } from './RevisionTimer';

interface OverviewDashboardProps {
  videos: VideoProject[];
  dailyGoal: DailyGoal | null;
  streakDays: number;
  approvedCount: number;
  totalCompletedRevisions: number;
  totalTargetRevisions: number;
  overallProgressPercent: number;
  onNavigateToTopics: () => void;
  onOpenAddModal: () => void;
  onSetDailyGoalVideo: (videoId: string) => void;
  onCompleteDailyGoal: (video: VideoProject) => void;
  onIncrementRevision: (video: VideoProject, addedDurationSeconds?: number) => void;
  onSaveProjectTime?: (videoId: string, durationSeconds: number) => void;
  onOpenStreakCalendarModal: () => void;
  onOpenReflectionModal: () => void;
  soundMuted: boolean;
}

const INSPIRATIONAL_QUOTES = [
  { text: "Consistency is the key to deep mastery.", author: "Marcus Aurelius" },
  { text: "Focus on process over outcome — revision by revision.", author: "James Clear" },
  { text: "Small daily efforts compound into extraordinary knowledge.", author: "Darren Hardy" },
  { text: "Deep learning requires deliberate, quiet repetition.", author: "Cal Newport" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Your future self will thank you for today's focused effort.", author: "Momentum Mindset" }
];

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  videos,
  dailyGoal,
  streakDays,
  approvedCount,
  totalCompletedRevisions,
  totalTargetRevisions,
  overallProgressPercent,
  onNavigateToTopics,
  onOpenAddModal,
  onSetDailyGoalVideo,
  onCompleteDailyGoal,
  onIncrementRevision,
  onSaveProjectTime,
  onOpenStreakCalendarModal,
  onOpenReflectionModal,
  soundMuted
}) => {
  // Target topic for today
  const targetVideo = videos.find(v => v.id === dailyGoal?.videoId) || videos[0];
  const isGoalCompletedToday = Boolean(dailyGoal?.completed);
  const [showTimer, setShowTimer] = useState(false);

  // Real-time clock for Momentum UI
  const [timeStr, setTimeStr] = useState('');
  const [greeting, setGreeting] = useState('');
  
  // Daily Wisdom state
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length));

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % INSPIRATIONAL_QUOTES.length);
  };

  const currentQuote = INSPIRATIONAL_QUOTES[quoteIndex];

  // Year Countdown stats
  const yearStats = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

    let totalDaysLeft = 0;
    let daysExcludingSundays = 0;

    const temp = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (temp <= yearEnd) {
      totalDaysLeft++;
      if (temp.getDay() !== 0) { // Sunday is 0
        daysExcludingSundays++;
      }
      temp.setDate(temp.getDate() + 1);
    }

    return { totalDaysLeft, daysExcludingSundays, currentYear };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }));

      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayDateString = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const targetCount = targetVideo?.targetRevisionCount || 5;
  const currentCount = targetVideo?.revisionCount || 0;
  const targetProgressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));

  return (
    <div className="flex-1 flex flex-col justify-between items-center py-6 px-4 sm:px-8 max-w-4xl mx-auto w-full text-white min-h-[calc(100vh-80px)]">
      
      {/* Top Controls Row */}
      <div className="w-full flex items-center justify-between text-white flex-wrap gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-200 bg-stone-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-sm">
            {todayDateString}
          </span>

          <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 backdrop-blur-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5" title={`${yearStats.totalDaysLeft} days remaining in ${yearStats.currentYear}. Excluding Sundays, there are ${yearStats.daysExcludingSundays} effective study days left.`}>
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{yearStats.totalDaysLeft}d left in {yearStats.currentYear} ({yearStats.daysExcludingSundays} study days)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReflectionModal}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Open Today's Commitment & Reflection"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-300" />
            <span>Today's Commitment</span>
          </button>

          <button
            onClick={onOpenStreakCalendarModal}
            className="flex items-center gap-1.5 bg-stone-900/60 hover:bg-stone-900/80 text-white backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
            title="30-Day Activity Heatmap"
          >
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span>Heatmap ({streakDays}d)</span>
          </button>
        </div>
      </div>

      {/* Main Center Content: Momentum Time & Daily Goal Focal Point */}
      <div className="max-w-xl w-full text-center my-auto py-6 space-y-6">
        
        {/* Real-time Digital Clock & Greeting */}
        <div className="space-y-1.5">
          <h1 className="text-6xl sm:text-8xl font-black text-white tracking-tight drop-shadow-lg font-mono">
            {timeStr || '10:00 AM'}
          </h1>
          <p className="text-xl sm:text-2xl font-bold text-stone-100 drop-shadow-md">
            {greeting}, Scholar.
          </p>
        </div>

        {/* Daily Wisdom Widget */}
        <div className="bg-stone-900/60 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-left shadow-lg relative group transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Daily Wisdom</span>
            </div>
            <button 
              onClick={handleNextQuote}
              className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-medium"
              title="Next Motivational Quote"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-stone-100 italic font-medium leading-relaxed">
            "{currentQuote.text}"
          </p>
          <p className="text-[11px] font-semibold text-emerald-300/90 text-right mt-1">
            — {currentQuote.author}
          </p>
        </div>

        {/* Momentum Centered Daily Goal Card */}
        {!targetVideo ? (
          /* Empty State */
          <div className="bg-stone-900/70 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center text-white shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-white/10 text-emerald-300 rounded-2xl flex items-center justify-center mx-auto border border-white/20">
              <Target className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold">No Goal Topic Set</h2>
              <p className="text-xs text-stone-300 mt-1">
                Add a study topic to focus on today.
              </p>
            </div>
            <button
              onClick={onOpenAddModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Study Topic</span>
            </button>
          </div>
        ) : (
          /* Main Focused Daily Goal Component */
          <div className="bg-stone-900/70 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-5 text-left transition-all">
            
            {/* Header: Label & Topic Selector */}
            <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-500/40 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  Today's Main Goal
                </span>
                {targetVideo.subject && (
                  <span className="text-xs text-stone-300 font-medium truncate max-w-[150px]">
                    {targetVideo.subject}
                  </span>
                )}
              </div>

              {/* Topic Selector if multiple topics */}
              {videos.length > 1 && (
                <select
                  value={targetVideo.id}
                  onChange={(e) => onSetDailyGoalVideo(e.target.value)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-xl border border-white/20 focus:outline-none cursor-pointer"
                >
                  {videos.map((v) => (
                    <option key={v.id} value={v.id} className="text-stone-900 font-medium">
                      🎯 {v.title} ({v.revisionCount}/{v.targetRevisionCount || 5})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                {targetVideo.title}
              </h2>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-200">
                <span className="flex items-center gap-1 text-emerald-300">
                  <Target className="w-3.5 h-3.5" />
                  Target Progress
                </span>
                <span>
                  {currentCount} / {targetCount} Revisions ({targetProgressPercent}%)
                </span>
              </div>

              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${targetProgressPercent}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full"
                />
              </div>
            </div>

            {/* Stopwatch Toggle */}
            <div className="pt-1">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowTimer(!showTimer)}
                  className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Timer className="w-4 h-4" />
                  <span>{showTimer ? 'Hide Study Timer' : 'Open Study Timer'}</span>
                </button>
              </div>

              <AnimatePresence>
                {showTimer && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pt-3"
                  >
                    <div className="bg-stone-950/70 rounded-2xl p-3 border border-white/15 text-stone-900">
                      <RevisionTimer
                        totalTimeSeconds={targetVideo.totalTimeSeconds || 0}
                        onSaveTime={(sec) => {
                          if (onSaveProjectTime) onSaveProjectTime(targetVideo.id, sec);
                        }}
                        onSaveTimeAndIncrement={(sec) => {
                          onIncrementRevision(targetVideo, sec);
                        }}
                        soundMuted={soundMuted}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Primary CTA Button */}
            <div className="pt-2">
              {isGoalCompletedToday ? (
                <div className="w-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-semibold text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2 backdrop-blur-md">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span>Goal Achieved Today! Outstanding job!</span>
                </div>
              ) : (
                <button
                  onClick={() => onCompleteDailyGoal(targetVideo)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Mark +1 Revision Completed Today</span>
                </button>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Bottom Footer Navigation */}
      <div className="pt-4 pb-2 text-center">
        <button
          onClick={onNavigateToTopics}
          className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-full transition-all cursor-pointer shadow-lg active:scale-95"
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          <span>View All Study Topics ({videos.length})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
