import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, Plus, Clock, Trash2 } from 'lucide-react';
import { VideoProject, RevisionLog, RevisionReason } from '../types';
import { soundEffects } from '../lib/sound';
import { RevisionTimer } from './RevisionTimer';
import { formatTimeSeconds } from '../lib/timeUtils';

interface RevisionDetailsModalProps {
  video: VideoProject | null;
  isOpen: boolean;
  onClose: () => void;
  onIncrementRevisionWithLog: (
    videoId: string, 
    currentCount: number, 
    log: Omit<RevisionLog, 'id' | 'revisionNumber' | 'timestamp'>,
    existingLogs: RevisionLog[]
  ) => void;
  onDeleteLog?: (videoId: string, logId: string) => void;
  onSaveProjectTime?: (videoId: string, durationSeconds: number) => void;
  onUpdateTargetCount?: (videoId: string, targetCount: number) => void;
  soundMuted: boolean;
}

const REASON_OPTIONS: RevisionReason[] = [
  'First Watch 📺',
  'Quick Recap ⚡',
  'Practice Problems 📝',
  'Formula & Concept Review 🧠',
  'Active Recall & Test 🎯',
  'Deep Dive 🔍',
  'Pre-Exam Polish 🎓'
];

export const RevisionDetailsModal: React.FC<RevisionDetailsModalProps> = ({
  video,
  isOpen,
  onClose,
  onIncrementRevisionWithLog,
  onDeleteLog,
  onSaveProjectTime,
  soundMuted
}) => {
  const [selectedReason, setSelectedReason] = useState<RevisionReason>('Active Recall & Test 🎯');
  const [logNotes, setLogNotes] = useState('');
  const [isAddingLog, setIsAddingLog] = useState(false);

  if (!isOpen || !video) return null;

  const handleAddRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.pop(soundMuted);

    onIncrementRevisionWithLog(
      video.id,
      video.revisionCount,
      {
        reason: selectedReason,
        notes: logNotes.trim()
      },
      video.revisionLogs || []
    );

    setLogNotes('');
    setIsAddingLog(false);
  };

  const logs = video.revisionLogs || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="revision-details-modal bg-white border border-stone-200 rounded-3xl p-6 max-w-xl w-full shadow-lg max-h-[90dvh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold bg-[#edf2e8] text-[#3b4e28] border border-[#c2d4b0] px-2 py-0.5 rounded-md uppercase">
                  {video.status.replace('_', ' ')}
                </span>
                {video.subject && (
                  <span className="text-xs text-stone-500 font-medium">
                    Subject: <span className="text-stone-800 font-semibold">{video.subject}</span>
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-stone-900 leading-snug">
                {video.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-3 gap-2.5 my-3.5">
            <div className="revision-stat-card border rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-semibold text-stone-500 uppercase block">Revisions</span>
              <span className="text-lg font-bold text-stone-900">
                {video.revisionCount} / {video.targetRevisionCount || 5}
              </span>
            </div>

            <div className="revision-stat-card border rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-semibold text-stone-500 uppercase block">Total Time</span>
              <span className="text-sm font-bold text-stone-900 mt-0.5 block">
                {formatTimeSeconds(video.totalTimeSeconds || 0)}
              </span>
            </div>

            <div className="revision-stat-card border rounded-xl p-2.5 text-center">
              <span className="text-[10px] font-semibold text-stone-500 uppercase block">Total Logs</span>
              <span className="text-lg font-bold text-stone-900">{logs.length}</span>
            </div>
          </div>

          {video.notes && (
            <div className="revision-note-card border rounded-xl p-3 mb-3">
              <span className="text-[10px] font-bold text-[#4f6435] uppercase block mb-0.5">Topic Note</span>
              <p className="text-xs text-stone-800 leading-relaxed">{video.notes}</p>
            </div>
          )}

          {/* Stopwatch Timer */}
          <div className="mb-3">
            <RevisionTimer
              totalTimeSeconds={video.totalTimeSeconds || 0}
              onSaveTime={(sec) => {
                if (onSaveProjectTime) onSaveProjectTime(video.id, sec);
              }}
              onSaveTimeAndIncrement={(sec) => {
                onIncrementRevisionWithLog(
                  video.id,
                  video.revisionCount,
                  {
                    reason: selectedReason,
                    notes: logNotes.trim() || `Session duration: ${formatTimeSeconds(sec)}`,
                    durationSeconds: sec
                  },
                  video.revisionLogs || []
                );
              }}
              soundMuted={soundMuted}
            />
          </div>

          {/* Add Log Form */}
          {!isAddingLog ? (
            <button
              onClick={() => setIsAddingLog(true)}
              className="w-full bg-[#4f6435] hover:bg-[#3f512a] text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs mb-3 flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Log Study Session #{video.revisionCount + 1}
            </button>
          ) : (
            <form onSubmit={handleAddRevisionSubmit} className="revision-log-form border rounded-2xl p-3.5 mb-3 space-y-2.5">
              <h4 className="font-bold text-stone-900 text-xs">
                Logging Revision #{video.revisionCount + 1}
              </h4>

              <div className="flex flex-wrap gap-1">
                {REASON_OPTIONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      selectedReason === reason
                        ? 'bg-[#4f6435] text-white border-[#4f6435]'
                        : 'revision-reason-button text-stone-700 border-stone-200'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder="Session notes (e.g. Practiced 5 problems)..."
                className="revision-log-input w-full border rounded-xl px-3 py-1.5 text-xs font-normal placeholder-stone-400 focus:outline-none focus:border-[#4f6435]"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingLog(false)}
                  className="revision-cancel-button px-2.5 py-1 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#4f6435] hover:bg-[#3f512a] text-white font-semibold px-3 py-1 rounded-xl text-xs cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </form>
          )}

          {/* Logs List Stream */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            <h3 className="revision-log-heading text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 sticky top-0 py-1">
              <History className="w-3.5 h-3.5 text-[#4f6435]" />
              Revision Logs
            </h3>

            {logs.length === 0 ? (
              <p className="text-xs text-stone-400 italic py-4 text-center">
                No revisions logged yet.
              </p>
            ) : (
              logs.slice().reverse().map((log) => (
                <div
                  key={log.id}
                  className="revision-log-card border rounded-xl p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-[#edf2e8] text-[#334223] font-semibold text-[10px] px-2 py-0.5 rounded-md border border-[#c2d4b0]">
                        Rev #{log.revisionNumber}
                      </span>
                      {log.reason && (
                        <span className="text-stone-700 font-medium">
                          {log.reason}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-stone-400">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                      {onDeleteLog && (
                        <button
                          onClick={() => {
                            soundEffects.delete(soundMuted);
                            onDeleteLog(video.id, log.id);
                          }}
                          className="p-0.5 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-stone-700 text-xs mt-0.5">
                      "{log.notes}"
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-stone-200 mt-3 flex justify-end">
            <button
              onClick={onClose}
              className="revision-done-button font-semibold px-4 py-1.5 rounded-xl text-xs cursor-pointer"
            >
              Done
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
