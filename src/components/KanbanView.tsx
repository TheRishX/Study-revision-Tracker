import React from 'react';
import { VideoProject, VideoStatus } from '../types';
import { VideoCard } from './VideoCard';
import { Plus } from 'lucide-react';

interface KanbanViewProps {
  videos: VideoProject[];
  onIncrementRevision: (video: VideoProject) => void;
  onDeleteVideo: (videoId: string) => void;
  onUpdateStatus: (videoId: string, newStatus: VideoStatus) => void;
  onOpenDetails: (video: VideoProject) => void;
  onOpenAddModal: () => void;
  soundMuted: boolean;
}

const COLUMNS: { id: VideoStatus; title: string; bg: string }[] = [
  { id: 'not_started', title: 'Not Started ○', bg: 'bg-stone-50/70' },
  { id: 'in_progress', title: 'Active Learning 📖', bg: 'bg-[#fafbfa]' },
  { id: 'revision_due', title: 'Revision Due 🔄', bg: 'bg-amber-50/50' },
  { id: 'mastered', title: 'Mastered 🏆', bg: 'bg-emerald-50/50' },
  { id: 'on_hold', title: 'Paused ⏸️', bg: 'bg-stone-50' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  videos,
  onIncrementRevision,
  onDeleteVideo,
  onUpdateStatus,
  onOpenDetails,
  onOpenAddModal,
  soundMuted
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colVideos = videos.filter((v) => v.status === col.id);

        return (
          <div
            key={col.id}
            className={`${col.bg} border border-stone-200/80 rounded-2xl p-4 min-h-[480px] flex flex-col shadow-xs`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="font-bold text-stone-900 text-sm">
                {col.title}
              </h3>
              <span className="bg-[#4f6435] text-white font-semibold text-[11px] px-2 py-0.5 rounded-full">
                {colVideos.length}
              </span>
            </div>

            {/* Video Cards in Column */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
              {colVideos.length === 0 ? (
                <div className="border border-dashed border-stone-200 rounded-xl p-6 text-center text-stone-400 text-xs font-medium my-auto">
                  No topics in {col.title}
                </div>
              ) : (
                colVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onIncrementRevision={onIncrementRevision}
                    onDeleteVideo={onDeleteVideo}
                    onUpdateStatus={onUpdateStatus}
                    onOpenDetails={onOpenDetails}
                    soundMuted={soundMuted}
                  />
                ))
              )}
            </div>

            {/* Column Quick Add */}
            <button
              onClick={onOpenAddModal}
              className="mt-3 w-full bg-white hover:bg-stone-50 text-stone-700 font-medium text-xs py-2 rounded-xl border border-stone-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#4f6435]" />
              Add Topic
            </button>
          </div>
        );
      })}
    </div>
  );
};
