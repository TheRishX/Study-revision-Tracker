import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VideoProject, VideoStatus } from '../types';
import { Plus, Clock, Target, Check, Trash2, Eye } from 'lucide-react';
import { soundEffects } from '../lib/sound';

interface SmallGridViewProps {
  videos: VideoProject[];
  isMultiSelectMode?: boolean;
  selectedVideoIds?: string[];
  onToggleSelect?: (id: string) => void;
  onIncrementRevision: (video: VideoProject) => void;
  onDeleteVideo: (videoId: string) => void;
  onUpdateStatus: (videoId: string, newStatus: VideoStatus) => void;
  onOpenDetails: (video: VideoProject) => void;
  soundMuted: boolean;
}

export const SmallGridView: React.FC<SmallGridViewProps> = ({
  videos,
  isMultiSelectMode,
  selectedVideoIds = [],
  onToggleSelect,
  onIncrementRevision,
  onDeleteVideo,
  onUpdateStatus,
  onOpenDetails,
  soundMuted
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (confirmDeleteId === videoId) {
      soundEffects.delete(soundMuted);
      onDeleteVideo(videoId);
      setConfirmDeleteId(null);
      return;
    }
    setConfirmDeleteId(videoId);
    setTimeout(() => setConfirmDeleteId(null), 3000);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      <AnimatePresence>
        {videos.map((video) => {
          const targetCount = video.targetRevisionCount || 5;
          const revCount = video.revisionCount;
          const progressPercent = Math.min(100, Math.round((revCount / targetCount) * 100));
          const isSelected = selectedVideoIds.includes(video.id);

          return (
            <motion.div
              layout
              key={video.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={isMultiSelectMode && onToggleSelect ? () => onToggleSelect(video.id) : () => onOpenDetails(video)}
              className={`relative bg-white border rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-2xs hover:shadow-sm ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                  : 'border-stone-200/90 hover:border-emerald-500/50'
              }`}
            >
              {/* Checkbox for Multi-Select */}
              {isMultiSelectMode && (
                <div className="absolute top-2.5 right-2.5 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelect && onToggleSelect(video.id);
                    }}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              )}

              <div>
                {/* Category & Status */}
                <div className="flex items-center justify-between gap-1 mb-1.5 pr-5">
                  {video.subject ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[100px]">
                      {video.subject}
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-stone-400">Topic</span>
                  )}
                  
                  <span className={`w-2 h-2 rounded-full ${
                    video.status === 'mastered' ? 'bg-emerald-500' :
                    video.status === 'revision_due' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} title={video.status} />
                </div>

                {/* Title */}
                <h4 className="text-xs font-bold text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug mb-2">
                  {video.title}
                </h4>
              </div>

              {/* Progress & Revision Count */}
              <div className="mt-2 pt-2 border-t border-stone-100 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-stone-600">
                  <span>Revisions</span>
                  <span className="text-stone-900 font-bold">{revCount}/{targetCount}</span>
                </div>

                <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  />
                </div>

                {/* Bottom Quick Actions */}
                <div className="flex items-center justify-between pt-1 gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEffects.pop(soundMuted);
                      onIncrementRevision(video);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex-1 text-center shadow-2xs"
                  >
                    +1 Revise
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, video.id)}
                    className={`p-1 rounded-md text-[10px] transition-colors cursor-pointer ${
                      confirmDeleteId === video.id
                        ? 'bg-rose-600 text-white font-bold px-1.5'
                        : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    title="Delete Topic"
                  >
                    {confirmDeleteId === video.id ? 'Del?' : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>

            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
