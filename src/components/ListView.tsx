import React, { useState } from 'react';
import { VideoProject, VideoStatus } from '../types';
import { Trash2, Clock, Check, Plus, Eye, Sparkles, CheckSquare, Square } from 'lucide-react';
import { soundEffects } from '../lib/sound';
import { formatTimeSeconds } from '../lib/timeUtils';

interface ListViewProps {
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

export const ListView: React.FC<ListViewProps> = ({
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

  const isAllSelected = videos.length > 0 && videos.every(v => selectedVideoIds.includes(v.id));

  const handleToggleSelectAll = () => {
    if (!onToggleSelect) return;
    if (isAllSelected) {
      videos.forEach(v => {
        if (selectedVideoIds.includes(v.id)) onToggleSelect(v.id);
      });
    } else {
      videos.forEach(v => {
        if (!selectedVideoIds.includes(v.id)) onToggleSelect(v.id);
      });
    }
  };

  const handleDelete = (videoId: string) => {
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
    <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="bg-[#f7f9f6] border-b border-stone-200 text-stone-500 text-[10px] font-bold uppercase tracking-wider">
              {isMultiSelectMode && (
                <th className="py-2 px-3 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-stone-500 hover:text-stone-900 cursor-pointer"
                    title={isAllSelected ? "Deselect All" : "Select All"}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
              )}
              <th className="py-2 px-3">Study Topic</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Progress / Revisions</th>
              <th className="py-2 px-3">Time Studied</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {videos.map((video) => {
              const targetCount = video.targetRevisionCount || 5;
              const revCount = video.revisionCount;
              const progressPercent = Math.min(100, Math.round((revCount / targetCount) * 100));
              const isSelected = selectedVideoIds.includes(video.id);

              return (
                <tr 
                  key={video.id} 
                  className={`transition-colors group text-xs ${
                    isSelected ? 'bg-emerald-50/50' : 'hover:bg-[#f6f8f4]/60'
                  }`}
                >
                  {/* Selection Checkbox */}
                  {isMultiSelectMode && (
                    <td className="py-1.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect && onToggleSelect(video.id)}
                        className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                    </td>
                  )}
                  
                  {/* Topic Title & Subject */}
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-2">
                      <div 
                        onClick={() => onOpenDetails(video)}
                        className="cursor-pointer font-bold text-stone-900 text-xs hover:text-emerald-700 transition-colors truncate max-w-[260px]"
                        title={video.title}
                      >
                        {video.title}
                      </div>

                      {video.subject && (
                        <span className="text-[10px] font-semibold bg-[#edf2e8] text-[#334223] px-1.5 py-0.5 rounded border border-[#c2d4b0] flex-shrink-0">
                          {video.subject}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-1.5 px-3">
                    <select
                      value={video.status}
                      onChange={(e) => onUpdateStatus(video.id, e.target.value as VideoStatus)}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-lg border border-stone-200 bg-[#fafbfa] text-stone-800 focus:outline-none cursor-pointer"
                    >
                      <option value="not_started">○ Not Started</option>
                      <option value="in_progress">📖 Learning</option>
                      <option value="revision_due">🔄 Revise Due</option>
                      <option value="mastered">🏆 Mastered</option>
                      <option value="on_hold">⏸️ Paused</option>
                    </select>
                  </td>

                  {/* Revision Progress & Quick +1 Button */}
                  <td className="py-1.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-stone-800 whitespace-nowrap">
                        {revCount}/{targetCount}
                      </span>

                      <div className="w-20 bg-stone-200/70 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-[#4f6435] rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <button
                        onClick={() => {
                          soundEffects.pop(soundMuted);
                          onIncrementRevision(video);
                        }}
                        className="bg-[#4f6435] hover:bg-[#3f512a] text-white font-semibold text-[10px] px-2 py-0.5 rounded-md cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                        title="Add +1 Revision"
                      >
                        +1 Revise
                      </button>
                    </div>
                  </td>

                  {/* Total Time Studied */}
                  <td className="py-1.5 px-3 text-[11px] text-stone-600 whitespace-nowrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {formatTimeSeconds(video.totalTimeSeconds || 0)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-1.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpenDetails(video)}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px] px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        title="View Details & Timer"
                      >
                        <Eye className="w-3 h-3 text-stone-500" />
                        <span>Logs</span>
                      </button>

                      <button
                        onClick={() => handleDelete(video.id)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          confirmDeleteId === video.id
                            ? 'bg-rose-600 text-white'
                            : 'text-stone-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title="Delete Topic"
                      >
                        {confirmDeleteId === video.id ? 'Delete?' : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
