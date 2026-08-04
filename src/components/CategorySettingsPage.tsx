import React, { useEffect, useMemo, useState } from 'react';
import { Check, Edit3, GripVertical, Layers3, Plus, Save, Trash2 } from 'lucide-react';
import { StudyCategory, VideoProject } from '../types';

interface Props {
  categories: StudyCategory[];
  videos: VideoProject[];
  categoryForVideo: (video: VideoProject) => string;
  onCreateCategory: (name: string, color: string) => Promise<void>;
  onUpdateCategory: (category: StudyCategory, name: string, color: string) => Promise<void>;
  onDeleteCategory: (category: StudyCategory) => Promise<void>;
  onReorderCategories: (draggedId: string, targetId: string) => Promise<void>;
  onAssignTopic: (video: VideoProject, category: StudyCategory) => Promise<void>;
  onReorderTopics: (categoryId: string, draggedId: string, targetId: string) => Promise<void>;
  onAddTopic: (category: StudyCategory) => void;
}

const COLORS = ['#667a4f', '#7a6d4f', '#4f6f7a', '#755f78', '#8a654d', '#556b60'];

export const CategorySettingsPage: React.FC<Props> = ({
  categories, videos, categoryForVideo, onCreateCategory, onUpdateCategory, onDeleteCategory,
  onReorderCategories, onAssignTopic, onReorderTopics, onAddTopic,
}) => {
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(COLORS[0]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selected = categories.find(category => category.id === selectedId) || categories[0];

  useEffect(() => {
    if (!selectedId && categories[0]) setSelectedId(categories[0].id);
    if (selectedId && !categories.some(category => category.id === selectedId)) setSelectedId(categories[0]?.id || '');
  }, [categories, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setEditName(selected.name);
    setEditColor(selected.color);
    setEditing(false);
    setConfirmDelete(false);
  }, [selected?.id]);

  const topicCounts = useMemo(() => new Map(categories.map(category => [category.id, videos.filter(video => categoryForVideo(video) === category.id).length])), [categories, videos, categoryForVideo]);
  const selectedTopics = selected ? videos.filter(video => categoryForVideo(video) === selected.id).sort((a, b) => a.orderIndex - b.orderIndex) : [];

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    await onCreateCategory(newName.trim(), newColor);
    setNewName('');
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="eyebrow">Workspace settings</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-[#20251d] mt-2">Categories</h1>
        <p className="text-sm text-[#747c6d] mt-2">Organize your learning system. Drag categories and topics into the order that makes sense to you.</p>
      </div>

      <div className="grid lg:grid-cols-[330px_1fr] gap-6 items-start">
        <aside className="goal-card !p-4 lg:sticky lg:top-24">
          <form onSubmit={createCategory} className="p-2 pb-4 border-b border-[#e6e9e1]">
            <span className="field-label">New category</span>
            <div className="flex gap-2">
              <input value={newName} onChange={event => setNewName(event.target.value)} placeholder="e.g. System Design" className="focus-input min-w-0" />
              <input type="color" value={newColor} onChange={event => setNewColor(event.target.value)} className="w-11 h-11 rounded-xl border border-[#dfe4d9] bg-white p-1" title="Category color" />
              <button disabled={!newName.trim()} className="w-11 h-11 rounded-xl bg-[#4d5f38] text-white flex items-center justify-center disabled:opacity-40" title="Create category"><Plus className="w-4 h-4" /></button>
            </div>
          </form>

          <div className="pt-3 space-y-1">
            {categories.map(category => (
              <button
                key={category.id}
                draggable
                onDragStart={event => event.dataTransfer.setData('category-id', category.id)}
                onDragOver={event => event.preventDefault()}
                onDrop={event => { event.preventDefault(); const dragged = event.dataTransfer.getData('category-id'); if (dragged && dragged !== category.id) void onReorderCategories(dragged, category.id); }}
                onClick={() => setSelectedId(category.id)}
                className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition-colors ${selected?.id === category.id ? 'bg-[#edf2e8] text-[#34432a]' : 'hover:bg-[#f5f7f2] text-[#606958]'}`}
              >
                <GripVertical className="w-4 h-4 text-[#a8afa0] cursor-grab shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: category.color }} />
                <span className="text-sm font-medium truncate flex-1">{category.name}</span>
                <span className="text-xs text-[#8e9686] tabular-nums">{topicCounts.get(category.id) || 0}</span>
              </button>
            ))}
            {!categories.length && <div className="py-8 text-center text-sm text-[#8a9282]"><Layers3 className="w-6 h-6 mx-auto mb-2" />Create your first category.</div>}
          </div>
        </aside>

        <section className="goal-card !p-5 sm:!p-7 min-h-[420px]">
          {selected ? (
            <>
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#e6e9e1]">
                {editing ? (
                  <div className="flex flex-wrap gap-2 flex-1">
                    <input value={editName} onChange={event => setEditName(event.target.value)} className="focus-input max-w-xs" />
                    <input type="color" value={editColor} onChange={event => setEditColor(event.target.value)} className="w-11 h-11 rounded-xl border border-[#dfe4d9] bg-white p-1" />
                    <button onClick={async () => { await onUpdateCategory(selected, editName.trim(), editColor); setEditing(false); }} disabled={!editName.trim()} className="primary-button"><Save className="w-4 h-4" /> Save</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ background: selected.color }} />
                    <div><h2 className="text-xl font-semibold text-[#252b21] truncate">{selected.name}</h2><p className="text-xs text-[#899080] mt-1">{selectedTopics.length} {selectedTopics.length === 1 ? 'topic' : 'topics'}</p></div>
                  </div>
                )}
                {!editing && <div className="flex gap-1 shrink-0">
                  <button onClick={() => setEditing(true)} className="icon-button" title="Edit category"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => confirmDelete ? void onDeleteCategory(selected) : setConfirmDelete(true)} className={`icon-button ${confirmDelete ? 'bg-rose-600 text-white hover:bg-rose-700 hover:text-white w-auto px-3 text-xs font-semibold' : 'hover:text-rose-600'}`} title="Delete category">{confirmDelete ? 'Confirm delete' : <Trash2 className="w-4 h-4" />}</button>
                </div>}
              </div>

              <div className="flex items-center justify-between mt-6 mb-3">
                <div><h3 className="text-sm font-semibold text-[#3b4335]">Topics in this category</h3><p className="text-xs text-[#909789] mt-1">Drag to reorder. Use the menu to move a topic.</p></div>
                <button onClick={() => onAddTopic(selected)} className="subtle-button"><Plus className="w-4 h-4" /> Add topic</button>
              </div>

              <div className="space-y-2 min-h-28 rounded-2xl" onDragOver={event => event.preventDefault()}>
                {selectedTopics.map(topic => (
                  <div
                    key={topic.id}
                    draggable
                    onDragStart={event => event.dataTransfer.setData('topic-id', topic.id)}
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => { event.preventDefault(); const dragged = event.dataTransfer.getData('topic-id'); if (dragged && dragged !== topic.id) void onReorderTopics(selected.id, dragged, topic.id); }}
                    className="flex items-center gap-3 border border-[#e4e8df] bg-[#fcfdfa] rounded-xl p-3 hover:border-[#cdd5c4]"
                  >
                    <GripVertical className="w-4 h-4 text-[#a6ada0] cursor-grab shrink-0" />
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#343b2f] truncate">{topic.title}</p><p className="text-xs text-[#909789] mt-0.5">{topic.revisionCount}/{topic.targetRevisionCount || 5} revisions</p></div>
                    <select value={selected.id} onChange={event => { const category = categories.find(item => item.id === event.target.value); if (category) void onAssignTopic(topic, category); }} className="focus-input py-2 w-36 sm:w-44" aria-label={`Move ${topic.title} to category`}>
                      {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </div>
                ))}
                {!selectedTopics.length && <button onClick={() => onAddTopic(selected)} className="w-full border border-dashed border-[#d8ded2] rounded-2xl py-12 text-sm text-[#8a9282] hover:bg-[#f8faf6]"><Plus className="w-5 h-5 mx-auto mb-2" />Add the first topic to {selected.name}</button>}
              </div>
            </>
          ) : <div className="h-72 flex items-center justify-center text-sm text-[#8a9282]">Create a category to start organizing topics.</div>}
        </section>
      </div>
    </div>
  );
};
