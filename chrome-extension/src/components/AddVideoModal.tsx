import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, BookOpen, FileText, Sparkles, Check, Download } from 'lucide-react';
import { StudyCategory, VideoProject, VideoStatus } from '../types';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideo: (video: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onBatchAddVideos?: (videos: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  categories?: StudyCategory[];
  initialCategoryId?: string;
}

const MERN_PRESETS = [
  { label: '⚛️ React Hooks & State', title: 'React Hooks, useEffect & Custom Hooks', subject: 'React.js', tags: ['React', 'Frontend'] },
  { label: '🟢 Node & Express APIs', title: 'Building RESTful APIs with Express & Node', subject: 'Node / Express', tags: ['NodeJS', 'Express', 'Backend'] },
  { label: '🍃 MongoDB & Mongoose', title: 'MongoDB Schemas, Indexing & Aggregations', subject: 'Database', tags: ['MongoDB', 'Database'] },
  { label: '🔐 JWT Authentication', title: 'User Auth, Bcrypt Hashing & JWT Refresh Tokens', subject: 'Security', tags: ['JWT', 'Auth', 'MERN'] },
];

const DEFAULT_MD_EXAMPLE = `# React.js
- React Hooks & Custom Hooks #React #Hooks
- Redux Toolkit & State Management #React #Redux

# Node / Express
- REST API Routing & Controllers #NodeJS #Express
- JWT Token Authentication & Security #Auth #Security

# Database
- MongoDB Aggregation Framework #MongoDB #Database`;

export const AddVideoModal: React.FC<AddVideoModalProps> = ({
  isOpen,
  onClose,
  onAddVideo,
  onBatchAddVideos,
  categories = [],
  initialCategoryId,
}) => {
  const [tab, setTab] = useState<'single' | 'markdown'>('single');

  // Single Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Full Stack MERN');
  const [targetRevisionCount, setTargetRevisionCount] = useState(5);
  const [status] = useState<VideoStatus>('not_started');
  const [tags, setTags] = useState<string[]>(['MERN', 'WebDev']);
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (!isOpen || !initialCategoryId) return;
    const category = categories.find(item => item.id === initialCategoryId);
    if (category) {
      setCategoryId(category.automatic ? '' : category.id);
      setSubject(category.name);
    }
  }, [isOpen, initialCategoryId, categories]);

  // Markdown Bulk Import State
  const [markdownText, setMarkdownText] = useState(DEFAULT_MD_EXAMPLE);

  // Markdown Parser
  const parsedMarkdownTopics = useMemo(() => {
    if (!markdownText.trim()) return [];

    const lines = markdownText.split('\n');
    let currentCategory = 'General';
    const topics: Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Header detected e.g. # React.js or ## Node.js
      if (line.startsWith('#')) {
        const headerTitle = line.replace(/^#+\s*/, '').trim();
        if (headerTitle) {
          currentCategory = headerTitle;
        }
        continue;
      }

      // Preserve the pasted title exactly; only headings and pipe metadata are parsed.
      const cleaned = line;


      // Check for pipe delimiter: Title | Category | #tag1 #tag2
      let itemCategory = currentCategory;
      let itemTitle = cleaned;
      let tagSource = cleaned;
      let metadataTags = '';

      if (cleaned.includes('|')) {
        const parts = cleaned.split('|').map(p => p.trim());
        itemTitle = parts[0] || 'Untitled Topic';
        if (parts[1]) itemCategory = parts[1];
        metadataTags = parts.slice(2).join(',');
        tagSource = [parts[0], metadataTags].filter(Boolean).join(' ');
      }

      // Extract hashtags as tags without changing the pasted title.
      const hashtagTags = (tagSource.match(/#([\w-]+)/g) || []).map(tag => tag.slice(1));
      const plainMetadataTags = metadataTags.includes('#') ? [] : metadataTags.split(/[,;]+/).map(tag => tag.trim()).filter(Boolean);
      const extractedTags = [...new Set([...hashtagTags, ...plainMetadataTags])];


      // Map an explicit Markdown heading/category to one existing major category.
      const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      const normalizedCategory = normalize(itemCategory);
      const categoryMatches = categories.filter(category => {
        if (category.automatic) return false;
        const normalizedName = normalize(category.name);
        return normalizedName === normalizedCategory || normalizedCategory.includes(normalizedName) || category.keywords.some(keyword => normalize(keyword) === normalizedCategory);
      });
      const matchedCategory = categoryMatches.length === 1 ? categoryMatches[0] : undefined;

      if (itemTitle) {
        topics.push({
          title: itemTitle,
          subject: itemCategory,
          categoryId: matchedCategory?.id || '',
          categorySource: matchedCategory ? 'manual' : 'smart',
          revisionCount: 0,
          targetRevisionCount: 5,
          totalTimeSeconds: 0,
          status: 'not_started',
          tags: extractedTags.length ? extractedTags : [itemCategory.replace(/\s+/g, '')],
          notes: `Imported from Markdown under ${itemCategory}`,
          orderIndex: Date.now() + topics.length,
          revisionLogs: [
            {
              id: `log-init-${Date.now()}-${topics.length}`,
              revisionNumber: 0,
              reason: 'Imported from Markdown',
              notes: 'Added via 1-click Markdown bulk import.',
              durationSeconds: 0,
              timestamp: new Date().toISOString()
            }
          ]
        });
      }
    }

    return topics;
  }, [markdownText, categories]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof MERN_PRESETS[0]) => {
    setTitle(preset.title);
    setSubject(preset.subject);
    setTags(preset.tags);
  };

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddVideo({
      title: title.trim(),
      subject: subject.trim() || 'MERN Stack',
      categoryId,
      categorySource: categoryId ? 'manual' : 'smart',
      revisionCount: 0,
      targetRevisionCount: Math.max(1, targetRevisionCount),
      totalTimeSeconds: 0,
      status,
      tags: tags.length ? tags : ['MERN'],
      notes,
      orderIndex: Date.now(),
      revisionLogs: [
        {
          id: `log-init-${Date.now()}`,
          revisionNumber: 0,
          reason: 'Initial Topic Created',
          notes: notes || 'Topic added for study revision.',
          durationSeconds: 0,
          timestamp: new Date().toISOString()
        }
      ]
    });

    setTitle('');
    setSubject('Full Stack MERN');
    setTargetRevisionCount(5);
    setTags(['MERN', 'WebDev']);
    setNotes('');
    onClose();
  };

  const handleImportMarkdown = () => {
    if (!parsedMarkdownTopics.length) return;

    if (onBatchAddVideos) {
      onBatchAddVideos(parsedMarkdownTopics);
    } else {
      parsedMarkdownTopics.forEach(v => onAddVideo(v));
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white border border-stone-200 rounded-3xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 text-emerald-700">
                <BookOpen className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 leading-tight">Add Study Topics</h2>
                <p className="text-xs text-stone-500">Create individual topic or bulk import via Markdown</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 gap-1 mb-4">
            <button
              type="button"
              onClick={() => setTab('single')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'single'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Single Topic</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('markdown')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'markdown'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Markdown Bulk Import</span>
            </button>
          </div>

          {tab === 'single' ? (
            /* Single Topic Form */
            <div>
              {/* Quick MERN Presets */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                  Quick Presets:
                </label>
                <div className="flex flex-wrap gap-1">
                  {MERN_PRESETS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="text-xs font-medium bg-[#f6f8f4] hover:bg-[#edf2e8] text-[#334223] px-2.5 py-1 rounded-lg border border-[#c2d4b0] transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitSingle} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Topic Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Node.js Express Middleware & Routing"
                    className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600"
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
                          setSubject(category?.name || '');
                        }}
                        className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600"
                      >
                        <option value="">Uncategorized</option>
                        {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. React, Express, MongoDB"
                        className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-900 focus:outline-none focus:border-emerald-600"
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
                      value={targetRevisionCount}
                      onChange={(e) => setTargetRevisionCount(parseInt(e.target.value) || 5)}
                      className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    Key Concept / Initial Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Focus on error handling middleware..."
                    className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl px-3 py-2 text-xs font-normal text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add Topic</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Markdown Bulk Import */
            <div className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-800">
                    Paste Markdown Text
                  </label>
                  <span className="text-[10px] text-stone-500 font-medium">
                    Use <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700"># Heading</code> for categories & <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">#tag</code> for tags
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  placeholder="# Category Name&#10;- Topic title #tag1 #tag2"
                  className="w-full bg-[#fafbfa] border border-stone-200 rounded-xl p-3 text-xs font-mono text-stone-900 focus:outline-none focus:border-emerald-600 leading-relaxed"
                />
              </div>

              {/* Parsed Preview */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Parsed Preview ({parsedMarkdownTopics.length} topics detected)
                  </span>
                </div>

                {parsedMarkdownTopics.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto space-y-1.5 text-xs text-stone-700 pr-1">
                    {parsedMarkdownTopics.map((topic, i) => (
                      <div key={i} className="bg-white border border-emerald-100 rounded-xl p-2.5 grid sm:grid-cols-[minmax(0,1fr)_auto] gap-2 shadow-2xs">
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 block break-words">{topic.title}</span>
                          <span className="inline-flex text-[10px] text-stone-500 mt-1 bg-stone-100 px-1.5 py-0.5 rounded">
                            {categories.find(category => category.id === topic.categoryId)?.name || topic.subject || 'Smart category'}
                          </span>
                        </div>
                        {topic.tags && topic.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 sm:justify-end self-start">
                            {topic.tags.map((t, ti) => (
                              <span key={ti} className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    Paste markdown bullet lists or headings above to automatically parse topics.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportMarkdown}
                  disabled={!parsedMarkdownTopics.length}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Import {parsedMarkdownTopics.length} Topics in 1 Click</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
