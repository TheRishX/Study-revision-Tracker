import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trash2, 
  Plus, 
  Clock, 
  Target, 
  Edit3, 
  Timer, 
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { VideoProject, VideoStatus } from '../types';
import { soundEffects } from '../lib/sound';
import { RevisionTimer } from './RevisionTimer';
import { formatTimeSeconds } from '../lib/timeUtils';

interface VideoCardProps {
  video: VideoProject;
  isDailyGoalVideo?: boolean;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (videoId: string) => void;
  onIncrementRevision: (video: VideoProject, addedDurationSeconds?: number) => void;
  onDeleteVideo: (videoId: string) => void;
  onUpdateStatus: (videoId: string, newStatus: VideoStatus) => void;
  onOpenDetails: (video: VideoProject) => void;
  onOpenEditModal?: (video: VideoProject) => void;
  onSetDailyGoalVideo?: (videoId: string) => void;
  onSaveProjectTime?: (videoId: string, durationSeconds: number) => void;
  onSaveQuickNote?: (videoId: string, note: string) => void;
  soundMuted: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isDailyGoalVideo,
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
  onIncrementRevision,
  onDeleteVideo,
  onUpdateStatus,
  onOpenDetails,
  onOpenEditModal,
  onSetDailyGoalVideo,
  onSaveProjectTime,
  onSaveQuickNote,
  soundMuted
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [quickNote, setQuickNote] = useState(video.notes || '');
  const [isNoteSaved, setIsNoteSaved] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleBlurQuickNote = () => {
    if (onSaveQuickNote && quickNote !== (video.notes || '')) {
      onSaveQuickNote(video.id, quickNote);
      setIsNoteSaved(true);
      setTimeout(() => setIsNoteSaved(false), 2000);
    }
  };

  const targetCount = video.targetRevisionCount || 5;
  const progressPercent = Math.min(100, Math.round((video.revisionCount / targetCount) * 100));

  const handleRevisionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.pop(soundMuted);
    
    const nextCount = video.revisionCount + 1;
    if (nextCount % 5 === 0) {
      soundEffects.fanfare(soundMuted);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    onIncrementRevision(video);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3500);
      return;
    }
    soundEffects.delete(soundMuted);
    setIsDeleting(true);
    setTimeout(() => {
      onDeleteVideo(video.id);
    }, 250);
  };

  // Minimalist status badge
  const getStatusBadge = (status: VideoStatus) => {
    switch (status) {
      case 'not_started':
        return { label: 'Not Started', bg: 'bg-stone-50 text-stone-600 border-stone-200' };
      case 'mastered':
        return { label: 'Mastered', bg: 'bg-emerald-50 text-emerald-900 border-emerald-200' };
      case 'revision_due':
        return { label: 'Revision Due', bg: 'bg-amber-50 text-amber-900 border-amber-200' };
      case 'on_hold':
        return { label: 'Paused', bg: 'bg-stone-100 text-stone-600 border-stone-200' };
      default:
        return { label: 'Learning', bg: 'bg-[#f0f4eb] text-[#3b4e28] border-[#c4d4b2]' };
    }
  };

  const statusBadge = getStatusBadge(video.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDeleting ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={isMultiSelectMode && onToggleSelect ? () => onToggleSelect(video.id) : undefined}
      className={`relative bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all ${
        isMultiSelectMode ? 'cursor-pointer' : ''
      } ${
        isSelected 
          ? 'border-[#4f6435] bg-[#fafcfa] ring-2 ring-[#4f6435]/20 shadow-sm' 
          : 'border-stone-200/90 hover:border-[#4f6435]/40 shadow-xs hover:shadow-sm'
      }`}
    >
      {/* Checkbox for Multi-Select */}
      {isMultiSelectMode && (
        <div className="absolute top-3 right-3 z-10">
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={() => onToggleSelect && onToggleSelect(video.id)}
            className="w-4 h-4 accent-[#4f6435] rounded cursor-pointer"
          />
        </div>
      )}

      <div>
        {/* Header Row: Status & Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={video.status}
              onChange={(e) => onUpdateStatus(video.id, e.target.value as VideoStatus)}
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border focus:outline-none cursor-pointer ${statusBadge.bg}`}
            >
              <option value="not_started">○ Not Started</option>
              <option value="in_progress">📖 Learning</option>
              <option value="revision_due">🔄 Revision Due</option>
              <option value="mastered">🏆 Mastered</option>
              <option value="on_hold">⏸️ Paused</option>
            </select>

            {isDailyGoalVideo ? (
              <span className="text-[10px] font-semibold bg-[#edf2e8] text-[#334223] border border-[#c2d4b0] px-2 py-0.5 rounded-md">
                🎯 Today's Goal
              </span>
            ) : onSetDailyGoalVideo ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSetDailyGoalVideo(video.id);
                  soundEffects.pop(soundMuted);
                }}
                className="text-[10px] font-medium text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-300 px-2 py-0.5 rounded-md bg-stone-50 transition-colors cursor-pointer"
              >
                Set Today's Goal
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            {onOpenEditModal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenEditModal(video);
                }}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Edit Topic"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleDeleteClick}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                isConfirmingDelete
                  ? 'bg-rose-600 text-white'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
              title={isConfirmingDelete ? "Click again to confirm delete" : "Delete Topic"}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isConfirmingDelete && <span>Confirm?</span>}
            </button>
          </div>
        </div>

        {/* Title & Subject */}
        <div className="mb-3">
          <h3 
            onClick={() => onOpenDetails(video)}
            className="text-lg font-bold text-stone-900 cursor-pointer hover:text-[#3f522b] transition-colors leading-snug line-clamp-2"
          >
            {video.title}
          </h3>
          {video.subject && (
            <p className="text-xs font-medium text-stone-500 mt-1">
              Subject: <span className="text-stone-800 font-semibold">{video.subject}</span>
            </p>
          )}
        </div>

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {video.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md border border-stone-200/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Target Progress Bar */}
        <div className="bg-[#f9faf8] border border-stone-200/80 rounded-xl p-3 mb-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-stone-700">
            <span className="flex items-center gap-1 text-stone-600">
              <Target className="w-3.5 h-3.5 text-[#4f6435]" />
              Target: {targetCount}
            </span>
            <span className="font-semibold text-stone-900">
              {video.revisionCount} / {targetCount} Revisions
            </span>
          </div>

          <div className="w-full bg-stone-200/70 rounded-full h-2 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-[#4f6435] rounded-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Quick Session Note */}
        <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-2 mb-3">
          <div className="flex items-center justify-between text-[10px] font-semibold text-stone-500 mb-1">
            <span>Quick Notes:</span>
            {isNoteSaved && <span className="text-emerald-700">Saved!</span>}
          </div>
          <input
            type="text"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            onBlur={handleBlurQuickNote}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBlurQuickNote();
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Notes or struggles on this topic..."
            className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs font-normal text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#4f6435]"
          />
        </div>
      </div>

      {/* Bottom Section: Revisions Count, Stopwatch, Action Button */}
      <div className="border-t border-stone-100 pt-3 mt-1 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider block">
              Revisions Done
            </span>
            <span className="text-2xl font-bold text-stone-900">
              {video.revisionCount}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowTimer(!showTimer)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1 transition-colors cursor-pointer"
              title="Stopwatch Timer"
            >
              <Timer className="w-3.5 h-3.5 text-[#4f6435]" />
              <span>{formatTimeSeconds(video.totalTimeSeconds || 0)}</span>
            </button>

            <button
              onClick={() => onOpenDetails(video)}
              className="text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg flex items-center gap-0.5 transition-colors cursor-pointer"
            >
              Logs
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showTimer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <RevisionTimer
                totalTimeSeconds={video.totalTimeSeconds || 0}
                onSaveTime={(sec) => {
                  if (onSaveProjectTime) onSaveProjectTime(video.id, sec);
                }}
                onSaveTimeAndIncrement={(sec) => {
                  onIncrementRevision(video, sec);
                }}
                soundMuted={soundMuted}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleRevisionClick}
          className="w-full bg-[#4f6435] hover:bg-[#3f512a] text-white font-semibold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+1 Mark Revision</span>
        </button>
      </div>

    </motion.div>
  );
};
