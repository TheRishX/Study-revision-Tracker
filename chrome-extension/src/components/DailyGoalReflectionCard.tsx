import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  CheckCircle2, 
  Sparkles, 
  Sun, 
  BookOpen, 
  Edit3, 
  ChevronDown, 
  Plus, 
  Calendar, 
  Clock, 
  Award,
  ArrowRight,
  Flame
} from 'lucide-react';
import { VideoProject, DailyGoal, DailyReflection } from '../types';
import { soundEffects } from '../lib/sound';

interface DailyGoalReflectionCardProps {
  videos: VideoProject[];
  dailyGoal: DailyGoal | null;
  dailyReflection: DailyReflection | null;
  onSetDailyGoalVideo: (videoId: string) => void;
  onCompleteDailyGoal: (video: VideoProject) => void;
  onSaveDailyReflection: (expectation: string, reality: string) => void;
  soundMuted: boolean;
  onOpenAddModal: () => void;
}

export const DailyGoalReflectionCard: React.FC<DailyGoalReflectionCardProps> = ({
  videos,
  dailyGoal,
  dailyReflection,
  onSetDailyGoalVideo,
  onCompleteDailyGoal,
  onSaveDailyReflection,
  soundMuted,
  onOpenAddModal
}) => {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [expectation, setExpectation] = useState('');
  const [reality, setReality] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isEditingReflection, setIsEditingReflection] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Sync initial state from props
  useEffect(() => {
    if (dailyReflection) {
      setExpectation(dailyReflection.expectation || '');
      setReality(dailyReflection.reality || '');
      if (dailyReflection.expectation || dailyReflection.reality) {
        setIsSaved(true);
      }
    }
  }, [dailyReflection]);

  // Selected video for today's goal
  const targetVideo = videos.find(v => v.id === dailyGoal?.videoId);
  const isCompletedToday = Boolean(dailyGoal?.completed);

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.pop(soundMuted);
    onSaveDailyReflection(expectation, reality);
    setIsSaved(true);
    setIsEditingReflection(false);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100 border-3 border-amber-950 rounded-3xl p-5 sm:p-6 shadow-[6px_6px_0px_#451a03] mb-8 relative overflow-hidden">
      {/* Decorative Morning Sun Background Accent */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-yellow-300/40 rounded-full blur-2xl pointer-events-none" />

      {/* Morning Notification Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b-2 border-amber-950/10 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-amber-300 p-2.5 rounded-2xl border-2 border-amber-950 shadow-[2px_2px_0px_#451a03]">
            <Sun className="w-6 h-6 text-amber-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full border border-amber-950/40">
                Morning Focus ☀️
              </span>
              <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-950">
              Daily Goal: Master 1 Video A Day 🎯
            </h2>
          </div>
        </div>

        {/* Completion status pill */}
        {isCompletedToday ? (
          <div className="bg-emerald-300 text-emerald-950 border-2 border-emerald-950 font-black text-xs px-3 py-1.5 rounded-2xl shadow-[2px_2px_0px_#064e3b] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-900 fill-emerald-200" />
            Today's Goal Achieved! 🎉
          </div>
        ) : (
          <div className="bg-amber-200 text-amber-950 border-2 border-amber-950 font-extrabold text-xs px-3 py-1.5 rounded-2xl shadow-[2px_2px_0px_#451a03] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-900" />
            1 Video Goal Pending Today
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Today's Target Video Selector & Goal Status (7 cols) */}
        <div className="lg:col-span-7 bg-white/90 border-2 border-amber-950 rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#451a03] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-800" />
                Today's Selected Target Video
              </span>

              {videos.length > 0 && (
                <button
                  onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                  className="text-xs font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-950 px-2.5 py-1 rounded-xl border border-amber-950 flex items-center gap-1 transition-colors"
                >
                  {targetVideo ? 'Change Goal' : 'Select Goal'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Video Selector Dropdown Drawer */}
            <AnimatePresence>
              {isSelectorOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-3 bg-amber-50 border-2 border-amber-950 rounded-2xl p-3 space-y-2"
                >
                  <p className="text-xs font-bold text-amber-900/80 mb-2">
                    Choose 1 video topic to focus on and complete for today's goal:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {videos.map(v => (
                      <button
                        key={v.id}
                        onClick={() => {
                          onSetDailyGoalVideo(v.id);
                          setIsSelectorOpen(false);
                          soundEffects.pop(soundMuted);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-between transition-all ${
                          targetVideo?.id === v.id
                            ? 'bg-amber-300 border-amber-950 text-amber-950 shadow-[2px_2px_0px_#451a03]'
                            : 'bg-white border-amber-950/20 text-amber-950 hover:border-amber-950'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-black">{v.title}</span>
                          {v.subject && <span className="text-[10px] text-amber-800 block">📚 {v.subject}</span>}
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md border border-amber-950/30 flex-shrink-0">
                          {v.revisionCount} revs
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Target Card */}
            {targetVideo ? (
              <div className="bg-amber-50 border-2 border-amber-950 rounded-2xl p-4 mb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {targetVideo.subject && (
                        <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md border border-amber-950/30">
                          {targetVideo.subject}
                        </span>
                      )}
                      <span className="text-[10px] font-extrabold text-amber-900">
                        {targetVideo.revisionCount} / {targetVideo.targetRevisionCount || 5} Revisions Done
                      </span>
                    </div>
                    <h3 className="font-black text-amber-950 text-base sm:text-lg leading-tight">
                      {targetVideo.title}
                    </h3>
                  </div>

                  {isCompletedToday ? (
                    <span className="bg-emerald-200 text-emerald-950 text-xs font-black px-2.5 py-1 rounded-xl border border-emerald-950 flex-shrink-0">
                      Done Today! 🎉
                    </span>
                  ) : (
                    <span className="bg-amber-200 text-amber-950 text-xs font-black px-2.5 py-1 rounded-xl border border-amber-950 flex-shrink-0">
                      Goal Target 🎯
                    </span>
                  )}
                </div>

                {targetVideo.notes && (
                  <p className="text-xs font-medium text-amber-900 mt-2 line-clamp-2 italic">
                    "{targetVideo.notes}"
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-amber-50/60 border-2 border-dashed border-amber-950/30 rounded-2xl p-6 text-center mb-3 flex flex-col items-center">
                <BookOpen className="w-8 h-8 text-amber-800/50 mb-2" />
                <p className="text-xs font-bold text-amber-900/80 mb-3">
                  No video selected for today's goal yet.
                </p>
                {videos.length > 0 ? (
                  <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="bg-amber-400 hover:bg-yellow-300 text-amber-950 font-black text-xs px-4 py-2 rounded-xl border-2 border-amber-950 shadow-[2px_2px_0px_#451a03]"
                  >
                    Select Today's Goal Video 🎯
                  </button>
                ) : (
                  <button
                    onClick={onOpenAddModal}
                    className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs px-4 py-2 rounded-xl border-2 border-amber-950 shadow-[2px_2px_0px_#451a03] flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Add First Study Topic
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Target Video Action Button */}
          {targetVideo && (
            <div>
              <button
                onClick={() => onCompleteDailyGoal(targetVideo)}
                className={`w-full font-black text-sm py-3 px-4 rounded-2xl border-3 border-amber-950 shadow-[3px_3px_0px_#451a03] flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 ${
                  isCompletedToday
                    ? 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950'
                    : 'bg-amber-400 hover:bg-yellow-300 text-amber-950'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                {isCompletedToday ? 'Log Another Revision for Today\'s Goal' : 'Mark Today\'s Goal Completed (+1 Revision)'}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Daily Expectations v/s Reality Reflection (5 cols) */}
        <div className="lg:col-span-5 bg-white/90 border-2 border-amber-950 rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#451a03] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-800" />
                Expectations v/s Reality
              </span>

              {isSaved && !isEditingReflection && (
                <button
                  onClick={() => setIsEditingReflection(true)}
                  className="text-xs font-bold text-amber-900 underline hover:text-amber-950"
                >
                  Edit Note
                </button>
              )}
            </div>

            {/* Reflection Form */}
            {(!isSaved || isEditingReflection) ? (
              <form onSubmit={handleSaveReflection} className="space-y-3">
                {/* Expectation input */}
                <div>
                  <label className="text-[11px] font-black text-amber-900 uppercase block mb-1">
                    💭 What I thought I would achieve today (Expectations):
                  </label>
                  <textarea
                    rows={2}
                    value={expectation}
                    onChange={(e) => setExpectation(e.target.value)}
                    placeholder="e.g., Revise Integration by Parts and memorize all 5 key formulas."
                    className="w-full bg-amber-50 border-2 border-amber-950 rounded-xl p-2.5 text-xs font-bold text-amber-950 placeholder-amber-900/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Reality input */}
                <div>
                  <label className="text-[11px] font-black text-amber-900 uppercase block mb-1">
                    🎯 What I actually achieved today (Reality):
                  </label>
                  <textarea
                    rows={2}
                    value={reality}
                    onChange={(e) => setReality(e.target.value)}
                    placeholder="e.g., Completed 1 full revision round, solved 4 practice problems!"
                    className="w-full bg-amber-50 border-2 border-amber-950 rounded-xl p-2.5 text-xs font-bold text-amber-950 placeholder-amber-900/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-yellow-300 hover:bg-yellow-200 text-amber-950 font-black text-xs py-2.5 px-3 rounded-xl border-2 border-amber-950 shadow-[2px_2px_0px_#451a03]"
                >
                  Save Daily Reflection 📝
                </button>
              </form>
            ) : (
              /* Display Saved Reflection Card */
              <div className="space-y-3">
                <div className="bg-amber-50 border-2 border-amber-950/20 rounded-xl p-3">
                  <span className="text-[10px] font-black text-amber-800 uppercase block mb-1">
                    💭 Expectation (Planned):
                  </span>
                  <p className="text-xs font-bold text-amber-950">
                    {expectation || 'No expectation written yet.'}
                  </p>
                </div>

                <div className="bg-emerald-50 border-2 border-emerald-950/30 rounded-xl p-3">
                  <span className="text-[10px] font-black text-emerald-900 uppercase block mb-1">
                    🎯 Reality (Achieved):
                  </span>
                  <p className="text-xs font-bold text-emerald-950">
                    {reality || 'No reality log added yet.'}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reflection logged for today!</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
