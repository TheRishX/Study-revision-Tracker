import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Plus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onOpenAddModal: () => void;
  onLoadSampleData: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenAddModal,
  onLoadSampleData
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-200/90 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-xs flex flex-col items-center"
    >
      <div className="w-14 h-14 bg-[#f0f4eb] text-[#4f6435] border border-[#c2d4b0] rounded-2xl flex items-center justify-center mb-5">
        <BookOpen className="w-7 h-7 stroke-[2]" />
      </div>

      <h2 className="text-xl font-bold text-stone-900 mb-1">
        No Study Topics Listed
      </h2>
      <p className="text-xs text-stone-600 max-w-sm mb-6 leading-relaxed">
        Start tracking full stack development topics, log revision passes, and build deep retention.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full">
        <button
          onClick={onOpenAddModal}
          className="w-full sm:w-auto bg-[#4f6435] hover:bg-[#3d4d29] text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Add First Study Topic
        </button>

        <button
          onClick={onLoadSampleData}
          className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#4f6435]" />
          Load Full Stack Sample
        </button>
      </div>
    </motion.div>
  );
};
