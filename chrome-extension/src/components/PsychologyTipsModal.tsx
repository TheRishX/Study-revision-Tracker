import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Brain } from 'lucide-react';

interface PsychologyTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STUDY_HACKS = [
  {
    icon: '⏳',
    title: 'Optimal Spaced Repetition Schedule',
    subtitle: 'Flatten the forgetting curve permanently',
    description: 'Revise your video topic at key intervals: Day 1 (Immediate), Day 3 (First Recall), Day 7 (Consolidation), Day 14 (Long-term Memory), and Day 30 (Exam Ready). Following this schedule boosts retention above 90%!',
    badge: 'Core Rule 🧠'
  },
  {
    icon: '⚡',
    title: 'Active Recall vs. Passive Watching',
    subtitle: 'Don\'t just re-watch passively',
    description: 'Before hitting play on a study video for the 2nd or 3rd time, write down or speak out loud everything you remember about the topic first. Active recall forces your brain to build strong neural pathways.',
    badge: 'High Impact 🔥'
  },
  {
    icon: '🗣️',
    title: 'The 60-Second Feynman Test',
    subtitle: 'Test if you truly master the topic',
    description: 'Try explaining the core concept of the study video to an imaginary 10-year-old in under 60 seconds without using complex jargon. If you get stuck, that\'s your exact target area for your next revision round!',
    badge: 'Mastery Check 🎯'
  },
  {
    icon: '🔀',
    title: 'Interleaving Topics',
    subtitle: 'Avoid single-subject fatigue',
    description: 'Instead of revising Calculus 5 times in a single day, alternate between Calculus, Computer Science, and Chemistry. Interleaving builds stronger flexible cognitive connections.',
    badge: 'Cognitive Science ⚛️'
  },
  {
    icon: '⏱️',
    title: 'The 25/5 Pomodoro Revision Loop',
    subtitle: 'Maintain peak focus',
    description: 'Do 25 minutes of intense revision followed by a 5-minute break. Use our built-in stopwatch timer to log your revision round time automatically!',
    badge: 'Time Management ⌛'
  }
];

export const PsychologyTipsModal: React.FC<PsychologyTipsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-950/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white border-4 border-amber-950 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-[8px_8px_0px_#451a03] max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-amber-950/10 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-300 p-2.5 rounded-2xl border-2 border-amber-950 shadow-[2px_2px_0px_#451a03]">
                <Brain className="w-6 h-6 text-amber-950 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-amber-950">Study & Revision Science</h2>
                <p className="text-xs font-bold text-amber-800">Proven memory techniques to maximize your study video retention</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-amber-100 border-2 border-transparent hover:border-amber-950 transition-colors"
            >
              <X className="w-6 h-6 text-amber-950 stroke-[2.5]" />
            </button>
          </div>

          {/* List of Hacks */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 my-2">
            {STUDY_HACKS.map((hack, idx) => (
              <div
                key={idx}
                className="bg-amber-50/80 border-3 border-amber-950 rounded-2xl p-4 shadow-[3px_3px_0px_#451a03]"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{hack.icon}</span>
                    <h3 className="font-black text-amber-950 text-base">{hack.title}</h3>
                  </div>
                  <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full border border-amber-950 uppercase">
                    {hack.badge}
                  </span>
                </div>
                <p className="text-xs font-extrabold text-amber-800/80 mb-2">{hack.subtitle}</p>
                <p className="text-xs font-semibold text-amber-950 leading-relaxed bg-white p-3 rounded-xl border border-amber-950/20">
                  {hack.description}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t-2 border-amber-950/10 flex justify-end">
            <button
              onClick={onClose}
              className="bg-amber-400 hover:bg-yellow-300 text-amber-950 font-black px-6 py-2.5 rounded-2xl border-3 border-amber-950 shadow-[3px_3px_0px_#451a03] text-sm"
            >
              Got It! Let's Revise 📖
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

