import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Flame, Sparkles, CheckCircle, Lock } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  streakDays: number;
  totalRevisions: number;
  totalApproved: number;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
  streakDays,
  totalRevisions,
  totalApproved
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const userLevel = Math.floor(totalRevisions / 5) + 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white border border-stone-200 rounded-3xl p-6 max-w-xl w-full shadow-lg max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#f0f4eb] p-2 rounded-xl text-[#4f6435] border border-[#c2d4b0]">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  Trophies & Badges
                  <span className="text-[10px] font-semibold bg-[#edf2e8] text-[#334223] px-2 py-0.5 rounded-full border border-[#c2d4b0]">
                    Level {userLevel} Scholar
                  </span>
                </h2>
                <p className="text-xs text-stone-500">Track your study accomplishments and consistency</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <div className="bg-[#fafbfa] border border-stone-200 rounded-xl p-2.5 text-center">
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-0.5" />
              <span className="text-base font-bold text-stone-900 block">{streakDays} Days</span>
              <span className="text-[10px] text-stone-500 font-semibold uppercase">Streak</span>
            </div>

            <div className="bg-[#fafbfa] border border-stone-200 rounded-xl p-2.5 text-center">
              <Sparkles className="w-4 h-4 text-[#4f6435] mx-auto mb-0.5" />
              <span className="text-base font-bold text-stone-900 block">{totalRevisions}</span>
              <span className="text-[10px] text-stone-500 font-semibold uppercase">Revisions</span>
            </div>

            <div className="bg-[#fafbfa] border border-stone-200 rounded-xl p-2.5 text-center">
              <Trophy className="w-4 h-4 text-[#4f6435] mx-auto mb-0.5" />
              <span className="text-base font-bold text-stone-900 block">{totalApproved}</span>
              <span className="text-[10px] text-stone-500 font-semibold uppercase">Mastered</span>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 mb-3">
            <div className="sticky top-0 bg-white py-1">
              <h3 className="text-xs font-bold text-stone-700">
                Badges ({unlockedCount} / {achievements.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`border rounded-2xl p-3 transition-all ${
                    ach.unlocked
                      ? 'bg-[#fafbfa] border-[#c2d4b0]'
                      : 'bg-stone-50 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-2 rounded-xl text-lg ${
                      ach.unlocked ? 'bg-[#f0f4eb] text-[#4f6435]' : 'bg-stone-200 text-stone-500'
                    }`}>
                      {ach.unlocked ? ach.icon : <Lock className="w-4 h-4 text-stone-500" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-stone-900 text-xs">{ach.title}</h4>
                        {ach.unlocked && <CheckCircle className="w-3.5 h-3.5 text-[#4f6435]" />}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                        {ach.description}
                      </p>

                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] font-medium text-stone-500 mb-0.5">
                          <span>Progress</span>
                          <span>{ach.progress} / {ach.maxProgress}</span>
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#4f6435] h-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%` }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-stone-200 flex justify-end">
            <button
              onClick={onClose}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold px-4 py-1.5 rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
