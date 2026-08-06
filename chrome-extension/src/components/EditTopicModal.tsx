import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Edit3, Trash2, Save } from 'lucide-react';
import { StudyCategory, VideoProject, VideoStatus } from '../types';
import { soundEffects } from '../lib/sound';

interface EditTopicModalProps {
  video: VideoProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTopic: (videoId: string, updates: Partial<VideoProject>) => void;
  onDeleteTopic: (videoId: string) => void;
  soundMuted: boolean;
  categories?: StudyCategory[];
}

export const EditTopicModal: React.FC<EditTopicModalProps> = ({
  video,
  isOpen,
  onClose,
  onSaveTopic,
  onDeleteTopic,
  soundMuted,
  categories = [],
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [targetCount, setTargetCount] = useState(5);
  const [status, setStatus] = useState<VideoStatus>('not_started');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setSubject(video.subject || '');
      setTargetCount(video.targetRevisionCount || 5);
      setStatus(video.status || 'not_started');
      setNotes(video.notes || '');
      setTagsInput(video.tags ? video.tags.join(', ') : '');
      setCategoryId(video.categoryId || '');
    }
  }, [video]);

  if (!isOpen || !video) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEffects.pop(soundMuted);

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSaveTopic(video.id, {
      title: title.trim(),
      subject: subject.trim(),
      targetRevisionCount: Math.max(1, Number(targetCount) || 5),
      status,
      notes: notes.trim(),
      tags: parsedTags,
      categoryId,
      categorySource: categoryId ? 'manual' : 'smart',
    });

    onClose();
  };

  const handleDelete = () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      setTimeout(() => setIsConfirmingDelete(false), 3000);
      return;
    }
    soundEffects.delete(soundMuted);
    onDeleteTopic(video.id);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white border border-stone-200 rounded-3xl p-6 max-w-lg w-full shadow-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#f0f4eb] p-2 rounded-xl text-[#4f6435] border border-[#c2d4b0]">
                <Edit3 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">Edit Study Topic</h2>
                <p className="text-xs text-stone-500">Update title, target revisions, and notes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Topic Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4f6435]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Subject / Category
                </label>
                {categories.length ? (
                  <select
                    value={categories.find(category => category.id === categoryId)?.id || categories.find(category => category.name.toLocaleLowerCase() === subject.toLocaleLowerCase())?.id || ''}
                    onChange={(e) => {
                      const category = categories.find(item => item.id === e.target.value);
                      setCategoryId(category?.automatic ? '' : category?.id || '');
                      setSubject(category?.id === 'uncategorized' ? '' : category?.name || '');
                    }}
                    className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4f6435]"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4f6435]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Target Revisions 🎯
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-[#4f6435]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Topic Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VideoStatus)}
                className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4f6435] cursor-pointer"
              >
                <option value="not_started">○ Not Started</option>
                <option value="in_progress">📖 Active Learning</option>
                <option value="revision_due">🔄 Revision Due</option>
                <option value="mastered">🏆 Mastered</option>
                <option value="on_hold">⏸️ Paused</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="React, Frontend, Hooks"
                className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-[#4f6435]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Concept Notes & Struggle Points
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Important formulas, definitions, key takeaways..."
                className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl p-3 text-xs font-normal text-stone-900 focus:outline-none focus:border-[#4f6435]"
              />
            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className={`font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isConfirmingDelete
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                {isConfirmingDelete ? 'Click to Confirm Delete!' : 'Delete Topic'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-[#4f6435] hover:bg-[#3f512a] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
