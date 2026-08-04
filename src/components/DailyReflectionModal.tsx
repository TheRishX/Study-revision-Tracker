import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Edit3, Save, Sparkles, Check } from 'lucide-react';
import { DailyReflection } from '../types';

interface DailyReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyReflection: DailyReflection | null;
  onSaveDailyReflection: (expectation: string, reality: string) => void;
}

export const DailyReflectionModal: React.FC<DailyReflectionModalProps> = ({
  isOpen,
  onClose,
  dailyReflection,
  onSaveDailyReflection
}) => {
  const [expectation, setExpectation] = useState('');
  const [reality, setReality] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (dailyReflection) {
      setExpectation(dailyReflection.expectation || '');
      setReality(dailyReflection.reality || '');
    }
  }, [dailyReflection, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveDailyReflection(expectation, reality);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-stone-200 rounded-3xl p-6 max-w-lg w-full shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-[#f0f4eb] p-2 rounded-2xl text-[#4f6435] border border-[#c2d4b0]">
                <Edit3 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Today's Study Reflection</h2>
                <p className="text-xs text-stone-500">{todayStr} • Expectation vs Reality</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1 flex items-center gap-1.5">
                <span>🎯 Today's Expectation</span>
              </label>
              <textarea
                rows={3}
                value={expectation}
                onChange={(e) => setExpectation(e.target.value)}
                placeholder="What did you plan or expect to complete today? (e.g. Master React hooks, solve 5 practice problems)"
                className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#4f6435] leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1 flex items-center gap-1.5">
                <span>💡 Today's Reality</span>
              </label>
              <textarea
                rows={3}
                value={reality}
                onChange={(e) => setReality(e.target.value)}
                placeholder="What actually happened? Key takeaways, breakthroughs, or struggle points..."
                className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl p-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#4f6435] leading-relaxed"
              />
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              {isSaved ? (
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Saved Reflection!
                </span>
              ) : (
                <span className="text-[11px] text-stone-400 italic">Saved locally per calendar date</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#4f6435] hover:bg-[#3f512a] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Reflection
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
