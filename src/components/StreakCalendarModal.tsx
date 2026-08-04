import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Calendar as CalendarIcon, Sparkles, Clock, Edit3, Save, Zap } from 'lucide-react';
import { VideoProject, DailyReflection } from '../types';
import { formatTimeSeconds } from '../lib/timeUtils';

interface StreakCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: VideoProject[];
  streakDays: number;
  dailyReflection: DailyReflection | null;
  onSaveDailyReflection: (expectation: string, reality: string) => void;
  soundMuted?: boolean;
}

interface DayActivity {
  dateStr: string;
  dayNum: number;
  monthName: string;
  isToday: boolean;
  revisionCount: number;
  projectCount: number;
  logs: { videoTitle: string; subject?: string; reason?: string; durationSeconds?: number }[];
  reflection?: { expectation?: string; reality?: string };
}

export const StreakCalendarModal: React.FC<StreakCalendarModalProps> = ({
  isOpen,
  onClose,
  videos,
  streakDays,
  dailyReflection,
  onSaveDailyReflection
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [expectation, setExpectation] = useState('');
  const [reality, setReality] = useState('');
  const [isSavedReflection, setIsSavedReflection] = useState(false);

  useEffect(() => {
    if (dailyReflection) {
      setExpectation(dailyReflection.expectation || '');
      setReality(dailyReflection.reality || '');
    }
  }, [dailyReflection]);

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDailyReflection(expectation, reality);
    setIsSavedReflection(true);
    setTimeout(() => setIsSavedReflection(false), 2500);
  };

  const { daysActivity, total30DayRevisions, activeDaysCount, totalTrackedSeconds } = useMemo(() => {
    const today = new Date();
    const days: DayActivity[] = [];
    let revisionsIn30Days = 0;
    let activeDays = 0;

    const activityMap: Record<string, { revisions: number; projects: number; logs: { videoTitle: string; subject?: string; reason?: string; durationSeconds?: number }[] }> = {};

    videos.forEach(v => {
      if (v.revisionLogs) {
        v.revisionLogs.forEach(log => {
          if (log.timestamp) {
            const dateKey = log.timestamp.split('T')[0];
            if (!activityMap[dateKey]) {
              activityMap[dateKey] = { revisions: 0, projects: 0, logs: [] };
            }
            activityMap[dateKey].revisions += 1;
            activityMap[dateKey].logs.push({
              videoTitle: v.title,
              subject: v.subject,
              reason: log.reason || `Rev #${log.revisionNumber}`,
              durationSeconds: log.durationSeconds
            });
          }
        });
      }

      if (v.createdAt) {
        const createDateKey = v.createdAt.split('T')[0];
        if (!activityMap[createDateKey]) {
          activityMap[createDateKey] = { revisions: 0, projects: 0, logs: [] };
        }
        activityMap[createDateKey].projects += 1;
      }
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const isToday = i === 0;

      const act = activityMap[dateStr] || { revisions: 0, projects: 0, logs: [] };
      if (act.revisions > 0 || act.projects > 0) {
        activeDays += 1;
      }
      revisionsIn30Days += act.revisions;

      let refData: { expectation?: string; reality?: string } | undefined;
      try {
        const stored = localStorage.getItem(`dailyReflection_${dateStr}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          refData = { expectation: parsed.expectation, reality: parsed.reality };
        }
      } catch (err) {
        // ignore
      }
      if (isToday && dailyReflection) {
        refData = { expectation: dailyReflection.expectation, reality: dailyReflection.reality };
      }

      days.push({
        dateStr,
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString(undefined, { month: 'short' }),
        isToday,
        revisionCount: act.revisions,
        projectCount: act.projects,
        logs: act.logs,
        reflection: refData
      });
    }

    const trackedSecs = videos.reduce((acc, v) => acc + (v.totalTimeSeconds || 0), 0);

    return {
      daysActivity: days,
      total30DayRevisions: revisionsIn30Days,
      activeDaysCount: activeDays,
      totalTrackedSeconds: trackedSecs
    };
  }, [videos, dailyReflection]);

  if (!isOpen) return null;

  const selectedDay = selectedDayIndex !== null ? daysActivity[selectedDayIndex] : null;

  const getDayStyle = (count: number, isToday: boolean) => {
    if (isToday) {
      return 'bg-[#edf2e8] border-[#4f6435] text-[#334223] font-bold';
    }
    if (count === 0) {
      return 'bg-stone-50 border-stone-200/60 text-stone-400';
    }
    if (count === 1) {
      return 'bg-[#f0f4eb] border-[#c2d4b0] text-[#3d4d29]';
    }
    return 'bg-[#4f6435] border-[#3f512a] text-white font-semibold';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white border border-stone-200 rounded-3xl p-6 max-w-2xl w-full shadow-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#f0f4eb] p-2 rounded-xl text-[#4f6435] border border-[#c2d4b0]">
                <Flame className="w-5 h-5 fill-[#4f6435]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">30-Day Activity & Streak Heatmap</h2>
                <p className="text-xs text-stone-500">Track your daily study consistency and reflections</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="bg-[#fafbfa] border border-stone-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-semibold text-stone-500 uppercase block">Current Streak</span>
              <span className="text-base font-bold text-stone-900">{streakDays} Days</span>
            </div>

            <div className="bg-[#fafbfa] border border-stone-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-semibold text-stone-500 uppercase block">Active Days</span>
              <span className="text-base font-bold text-stone-900">{activeDaysCount} / 30</span>
            </div>

            <div className="bg-[#fafbfa] border border-stone-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-semibold text-stone-500 uppercase block">30-Day Revisions</span>
              <span className="text-base font-bold text-stone-900">{total30DayRevisions}</span>
            </div>

            <div className="bg-[#fafbfa] border border-stone-200 rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-semibold text-stone-500 uppercase block">Study Time</span>
              <span className="text-xs font-semibold text-stone-900 mt-1 block">
                {formatTimeSeconds(totalTrackedSeconds)}
              </span>
            </div>
          </div>

          {/* 30-Day Heatmap Grid */}
          <div className="bg-[#fafbfa] border border-stone-200 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[#4f6435]" />
                30-Day Activity Heatmap
              </h3>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
              {daysActivity.map((d, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`relative group p-1.5 rounded-xl border flex flex-col items-center justify-between min-h-[48px] transition-all cursor-pointer ${
                    selectedDayIndex === index ? 'ring-2 ring-[#4f6435]' : ''
                  } ${getDayStyle(d.revisionCount, d.isToday)}`}
                >
                  <span className="text-[9px] font-semibold">
                    {d.monthName} {d.dayNum}
                  </span>

                  <span className="text-[10px] font-bold mt-0.5">
                    {d.revisionCount > 0 ? `${d.revisionCount}r` : d.isToday ? 'Today' : '-'}
                  </span>

                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-stone-900 text-white text-[11px] p-2.5 rounded-xl shadow-lg w-56 z-30 pointer-events-none left-1/2 -translate-x-1/2">
                    <div className="font-bold border-b border-stone-700 pb-1 mb-1">
                      {d.monthName} {d.dayNum} {d.isToday ? '(Today)' : ''}
                    </div>

                    {d.reflection && (d.reflection.expectation || d.reflection.reality) && (
                      <div className="text-[10px] space-y-0.5 text-stone-300 mb-1">
                        {d.reflection.expectation && <div>Exp: "{d.reflection.expectation}"</div>}
                        {d.reflection.reality && <div>Real: "{d.reflection.reality}"</div>}
                      </div>
                    )}

                    <div className="text-[10px] text-stone-400">
                      Revisions: {d.revisionCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDay && (
            <div className="bg-[#fafbfa] border border-stone-200 rounded-xl p-3 mb-4">
              <h4 className="font-bold text-stone-900 text-xs mb-1">
                Details for {selectedDay.monthName} {selectedDay.dayNum}
              </h4>

              {selectedDay.reflection && (selectedDay.reflection.expectation || selectedDay.reflection.reality) && (
                <div className="text-xs text-stone-700 space-y-0.5 mb-2 bg-white p-2 rounded-lg border border-stone-200">
                  {selectedDay.reflection.expectation && <div><strong>Expectation:</strong> {selectedDay.reflection.expectation}</div>}
                  {selectedDay.reflection.reality && <div><strong>Reality:</strong> {selectedDay.reflection.reality}</div>}
                </div>
              )}

              {selectedDay.logs.length === 0 ? (
                <p className="text-xs text-stone-400 italic">No revisions recorded on this date.</p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedDay.logs.map((log, idx) => (
                    <div key={idx} className="text-xs text-stone-800 bg-white p-1.5 rounded-lg border border-stone-200">
                      • {log.videoTitle} ({log.reason})
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reflection Form */}
          <div className="bg-[#fafbfa] border border-stone-200 rounded-xl p-3.5 mb-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-[#4f6435]" />
                Today's Reflection
              </h4>
              {isSavedReflection && <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">✓ Saved</span>}
            </div>

            <form onSubmit={handleSaveReflection} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                    🎯 Today's Expectation
                  </label>
                  <input
                    type="text"
                    value={expectation}
                    onChange={(e) => setExpectation(e.target.value)}
                    placeholder="e.g. Complete 2 React revisions"
                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#4f6435]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                    💡 Today's Reality
                  </label>
                  <input
                    type="text"
                    value={reality}
                    onChange={(e) => setReality(e.target.value)}
                    placeholder="e.g. Mastered Custom Hooks"
                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#4f6435]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-[#4f6435] hover:bg-[#3f512a] text-white font-semibold text-xs px-3.5 py-1 rounded-xl cursor-pointer"
                >
                  Save Reflection
                </button>
              </div>
            </form>
          </div>

          <div className="pt-2 border-t border-stone-200 flex justify-end">
            <button
              onClick={onClose}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold px-4 py-1.5 rounded-xl text-xs cursor-pointer"
            >
              Done
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
