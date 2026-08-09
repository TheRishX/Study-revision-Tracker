import React, { useMemo, useRef, useState } from 'react';
import { ChevronRight, FileUp, FolderPlus, GripVertical, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { MainTopic, MainTopicCategory } from '../types';

type Draft = Omit<MainTopic, 'id' | 'createdAt' | 'updatedAt'>;
type Panel = 'topic' | 'import' | 'categories' | null;

interface Props {
  topics: MainTopic[];
  categories: MainTopicCategory[];
  onCreateTopic: (topic: Draft) => Promise<string>;
  onUpdateTopic: (id: string, updates: Partial<MainTopic>) => Promise<void>;
  onDeleteTopic: (id: string) => Promise<void>;
  onCreateCategory: (name: string) => Promise<void>;
  onRenameCategory: (oldName: string, newName: string) => Promise<void>;
  onDeleteCategory: (name: string) => Promise<void>;
  onReorderCategories: (orderedNames: string[]) => Promise<void>;
  onMoveTopic: (draggedId: string, targetId: string, placement: 'before' | 'inside' | 'after') => Promise<void>;
}

const emptyDraft = (): Draft => ({
  name: '', category: '', parentId: '', usedFor: '', completed: false, orderIndex: Date.now(),
});

const CATEGORY_COLORS = ['#6f8055', '#507985', '#84684f', '#71627f', '#4f7b67', '#8b655f', '#63758d'];
const categoryColor = (name: string) => {
  const hash = [...name].reduce((total, character) => total + character.charCodeAt(0), 0);
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
};
const isRootTopic = (topic: MainTopic, pool: MainTopic[]) => !topic.parentId || !pool.some(parent => parent.id === topic.parentId);

export const MernTopicsPage: React.FC<Props> = ({ topics, categories, onCreateTopic, onUpdateTopic, onDeleteTopic, onCreateCategory, onRenameCategory, onDeleteCategory, onReorderCategories, onMoveTopic }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<Panel>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [importText, setImportText] = useState('');
  const [importCategory, setImportCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const [draggedTopic, setDraggedTopic] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; placement: 'before' | 'inside' | 'after' } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Older builds could delete a parent while leaving its descendants behind.
  // Only display records that are reachable from a real root topic.
  const usableTopics = useMemo(() => {
    const reachable = new Set(topics.filter(topic => !topic.parentId).map(topic => topic.id));
    let changed = true;
    while (changed) {
      changed = false;
      topics.forEach(topic => {
        if (topic.parentId && reachable.has(topic.parentId) && !reachable.has(topic.id)) { reachable.add(topic.id); changed = true; }
      });
    }
    return topics.filter(topic => reachable.has(topic.id));
  }, [topics]);

  const allCategories = useMemo(() => {
    const order = new Map(categories.map(category => [category.name, category.orderIndex]));
    return [...new Set([
    ...categories.map(category => category.name), ...usableTopics.map(topic => topic.category),
    ].map(name => name.trim()).filter(Boolean))].sort((a, b) => (order.get(a) ?? 9999) - (order.get(b) ?? 9999) || a.localeCompare(b));
  }, [categories, usableTopics]);

  const displayedTopics = useMemo(() => {
    const inCategory = usableTopics.filter(topic => selectedCategory === 'all' || topic.category === selectedCategory);
    const search = query.trim().toLowerCase();
    if (!search) return inCategory;
    const byId = new Map(usableTopics.map(topic => [topic.id, topic]));
    const visibleIds = new Set<string>();
    inCategory.forEach(topic => {
      if (!`${topic.name} ${topic.usedFor}`.toLowerCase().includes(search)) return;
      let current: MainTopic | undefined = topic;
      while (current) { visibleIds.add(current.id); current = current.parentId ? byId.get(current.parentId) : undefined; }
    });
    return inCategory.filter(topic => visibleIds.has(topic.id));
  }, [usableTopics, selectedCategory, query]);

  const grouped = useMemo(() => displayedTopics.reduce<Record<string, MainTopic[]>>((groups, topic) => {
    (groups[topic.category || 'Uncategorized'] ||= []).push(topic);
    return groups;
  }, {}), [displayedTopics]);

  const closePanel = () => { setPanel(null); setEditingId(null); setDraft(emptyDraft()); setEditingCategory(null); setConfirmDeleteCategory(null); setImportCategory(''); };
  const openCreate = () => { setEditingId(null); setDraft({ ...emptyDraft(), category: selectedCategory === 'all' ? '' : selectedCategory }); setPanel('topic'); };
  const openImport = () => { setImportCategory(selectedCategory === 'all' ? '' : selectedCategory); setPanel('import'); };
  const startEdit = (topic: MainTopic) => { setEditingId(topic.id); setDraft({ name: topic.name, category: topic.category, parentId: topic.parentId || '', usedFor: topic.usedFor, completed: topic.completed, orderIndex: topic.orderIndex }); setPanel('topic'); };
  const updateDraft = (field: keyof Draft, value: string | boolean) => setDraft(current => ({ ...current, [field]: value }));
  const toggleTopic = (id: string) => setExpanded(current => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const saveTopic = async (event: React.FormEvent) => {
    event.preventDefault(); if (!draft.name.trim() || !draft.category) return; setSaving(true);
    try {
      const saved = { ...draft, name: draft.name.trim(), usedFor: draft.usedFor.trim() };
      if (editingId) await onUpdateTopic(editingId, saved); else await onCreateTopic(saved);
      closePanel();
    } finally { setSaving(false); }
  };

  const createCategory = async (event: React.FormEvent) => {
    event.preventDefault(); const name = newCategory.trim();
    if (!name || allCategories.some(category => category.toLowerCase() === name.toLowerCase())) return;
    setSaving(true); try { await onCreateCategory(name); setNewCategory(''); } finally { setSaving(false); }
  };

  const renameCategory = async (event: React.FormEvent) => {
    event.preventDefault(); const name = categoryName.trim();
    if (!editingCategory || !name || (name !== editingCategory && allCategories.some(category => category.toLowerCase() === name.toLowerCase()))) return;
    setSaving(true);
    try { await onRenameCategory(editingCategory, name); if (selectedCategory === editingCategory) setSelectedCategory(name); setEditingCategory(null); setCategoryName(''); }
    finally { setSaving(false); }
  };

  const removeCategory = async (name: string) => {
    if (confirmDeleteCategory !== name) { setConfirmDeleteCategory(name); return; }
    setSaving(true);
    try { await onDeleteCategory(name); if (selectedCategory === name) setSelectedCategory('all'); setConfirmDeleteCategory(null); }
    finally { setSaving(false); }
  };

  const dropCategory = async (target: string) => {
    if (!draggedCategory || draggedCategory === target) return;
    const reordered = [...allCategories];
    const from = reordered.indexOf(draggedCategory); const to = reordered.indexOf(target);
    if (from < 0 || to < 0) return;
    const [moved] = reordered.splice(from, 1); reordered.splice(to, 0, moved);
    setDraggedCategory(null); await onReorderCategories(reordered);
  };

  const topicDragOver = (event: React.DragEvent<HTMLElement>, targetId: string) => {
    if (!draggedTopic || draggedTopic === targetId) return;
    event.preventDefault(); event.dataTransfer.dropEffect = 'move';
    const bounds = event.currentTarget.getBoundingClientRect(); const ratio = (event.clientY - bounds.top) / bounds.height;
    setDropTarget({ id: targetId, placement: ratio < .25 ? 'before' : ratio > .75 ? 'after' : 'inside' });
  };

  const dropTopic = async (event: React.DragEvent<HTMLElement>, targetId: string) => {
    event.preventDefault();
    if (!draggedTopic || !dropTarget || dropTarget.id !== targetId) return;
    const { placement } = dropTarget; const id = draggedTopic;
    setDraggedTopic(null); setDropTarget(null); await onMoveTopic(id, targetId, placement);
  };

  const importTopics = async () => {
    setSaving(true);
    try {
      let category = importCategory || 'General'; const stack: { level: number; id: string }[] = [];
      for (const rawLine of importText.split(/\r?\n/)) {
        const line = rawLine.trim(); if (!line) continue;
        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
          const level = heading[1].length; const name = heading[2].trim(); if (level === 1 && !importCategory) category = name;
          while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
          const id = await onCreateTopic({ name, category, parentId: stack.at(-1)?.id || '', usedFor: '', completed: false, orderIndex: Date.now() });
          stack.push({ level, id }); continue;
        }
        if (!/^[-*+]\s+/.test(line)) continue;
        const [name, usedFor = ''] = line.replace(/^[-*+]\s+/, '').split(/\s+(?:—|–|-)\s+/, 2).map(value => value.trim());
        if (name) await onCreateTopic({ name, category, parentId: stack.at(-1)?.id || '', usedFor, completed: false, orderIndex: Date.now() });
      }
      setImportText(''); setPanel(null);
    } finally { setSaving(false); }
  };

  const renderTopic = (topic: MainTopic, items: MainTopic[], depth = 0): React.ReactNode => {
    const children = items.filter(item => item.parentId === topic.id);
    const open = query.trim() ? true : expanded.has(topic.id);
    return <React.Fragment key={topic.id}>
      <article draggable onDragStart={event => { setDraggedTopic(topic.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', topic.id); }} onDragEnd={() => { setDraggedTopic(null); setDropTarget(null); }} onDragOver={event => topicDragOver(event, topic.id)} onDrop={event => void dropTopic(event, topic.id)} className={`main-topic-row main-topic-depth-${Math.min(depth, 3)} ${children.length > 0 ? 'main-topic-branch' : 'main-topic-leaf'} ${topic.completed ? 'main-topic-done' : ''} ${draggedTopic === topic.id ? 'main-topic-dragging' : ''} ${dropTarget?.id === topic.id ? `main-topic-drop-${dropTarget.placement}` : ''}`}>
        <span className="main-topic-drag-handle" title="Drag to reorder or nest"><GripVertical className="w-4 h-4" /></span>
        <input type="checkbox" checked={topic.completed} onChange={event => void onUpdateTopic(topic.id, { completed: event.target.checked })} aria-label={`Mark ${topic.name} complete`} />
        {children.length > 0 ? <button onClick={() => toggleTopic(topic.id)} className={`main-topic-expand ${open ? 'main-topic-expanded' : ''}`} aria-label={`${open ? 'Collapse' : 'Expand'} ${topic.name}`}><ChevronRight className="w-4 h-4" /></button> : <span className="main-topic-spacer" />}
        <button type="button" onClick={() => children.length > 0 && toggleTopic(topic.id)} className="main-topic-name min-w-0 flex-1 text-left"><h3>{topic.name}</h3>{topic.usedFor && <p><b>Used for</b> {topic.usedFor}</p>}</button>
        {children.length > 0 && <span className="main-topic-child-count">{children.length}</span>}
        <button onClick={() => startEdit(topic)} title={`Edit ${topic.name}`}><Pencil className="w-4 h-4" /></button>
        <button onClick={() => void onDeleteTopic(topic.id)} title={`Delete ${topic.name}`} className="main-topic-delete"><Trash2 className="w-4 h-4" /></button>
      </article>
      {children.length > 0 && open && <div className="main-topic-children">{children.map(child => renderTopic(child, items, depth + 1))}</div>}
    </React.Fragment>;
  };

  return <div className="learning-map-page pb-16 space-y-4">
    <div className="flex items-end justify-between gap-4">
      <div><h1 className="text-xl font-bold text-stone-900">Topic Tracker ({usableTopics.filter(topic => isRootTopic(topic, usableTopics)).length})</h1><p className="text-xs text-stone-500">Track main topics and expand their multi-level subtopics</p></div>
      <div className="flex items-center gap-2"><button onClick={openImport} className="subtle-button !min-h-9 !px-3 text-xs"><FileUp className="w-3.5 h-3.5" /> Import</button><button onClick={openCreate} className="primary-button !min-h-9 !px-3 text-xs"><Plus className="w-3.5 h-3.5" /> Add topic</button></div>
    </div>

    <div className="learning-map-toolbar">
      <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] min-w-0">
        <button onClick={() => setSelectedCategory('all')} className={`category-filter ${selectedCategory === 'all' ? 'category-filter-active' : ''}`}>All topics <span>{usableTopics.filter(topic => isRootTopic(topic, usableTopics)).length}</span></button>
        {allCategories.map(category => { const categoryTopics = usableTopics.filter(topic => topic.category === category); return <button draggable onDragStart={event => { setDraggedCategory(category); event.dataTransfer.effectAllowed = 'move'; }} onDragOver={event => { if (draggedCategory) event.preventDefault(); }} onDrop={() => void dropCategory(category)} onDragEnd={() => setDraggedCategory(null)} key={category} onClick={() => setSelectedCategory(category)} className={`category-filter ${selectedCategory === category ? 'category-filter-active' : ''} ${draggedCategory === category ? 'category-filter-dragging' : ''}`}><i style={{ background: categoryColor(category) }} /> {category} <span>{categoryTopics.filter(topic => isRootTopic(topic, categoryTopics)).length}</span></button>; })}
        <button onClick={() => setPanel('categories')} className="category-filter"><FolderPlus className="w-3.5 h-3.5" /> Category</button>
      </div>
      <div className="relative learning-map-search"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa191]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search map…" className="focus-input search-input !py-2" />{query && <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7c8574]"><X className="w-3.5 h-3.5" /></button>}</div>
    </div>

    {usableTopics.length > 0 && <p className="learning-map-drag-help"><GripVertical className="w-3.5 h-3.5" /> Drag near the top or bottom of a row to reorder it. Drop in the center to nest it inside another topic.</p>}

    {(Object.entries(grouped) as [string, MainTopic[]][]).map(([category, items]) => <section className="main-topic-category" key={category} style={{ '--topic-accent': categoryColor(category) } as React.CSSProperties}><h2><span className="main-topic-category-name"><i />{category}</span><span>{items.length} items</span></h2><div>{items.filter(topic => isRootTopic(topic, items)).map(topic => renderTopic(topic, items))}</div></section>)}
    {!displayedTopics.length && <div className="mern-empty">No topics here yet. Add one or import a Markdown outline.</div>}

    {panel && <div className="learning-modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && closePanel()}><section className="learning-modal" role="dialog" aria-modal="true"><header><div><h2>{panel === 'topic' ? (editingId ? 'Edit topic' : 'Add topic') : panel === 'import' ? 'Import Markdown' : 'Categories'}</h2><p>{panel === 'topic' ? 'Create a main topic or nest it under another.' : panel === 'import' ? 'Turn a Markdown outline into a collapsible topic tracker.' : 'Add a category to organize your tracked topics.'}</p></div><button onClick={closePanel} className="icon-button"><X className="w-4 h-4" /></button></header>
      {panel === 'topic' && <form onSubmit={saveTopic} className="space-y-3"><label className="field-label">Topic name<input autoFocus required value={draft.name} onChange={event => updateDraft('name', event.target.value)} placeholder="e.g. React Hooks" className="focus-input mt-1" /></label><label className="field-label">Category<select required value={draft.category} onChange={event => { updateDraft('category', event.target.value); updateDraft('parentId', ''); }} className="focus-input mt-1"><option value="">Select a category</option>{allCategories.map(category => <option key={category}>{category}</option>)}</select></label><label className="field-label">Parent topic <span className="normal-case tracking-normal font-normal">(optional)</span><select value={draft.parentId || ''} onChange={event => updateDraft('parentId', event.target.value)} className="focus-input mt-1"><option value="">None — main topic</option>{usableTopics.filter(topic => topic.category === draft.category && topic.id !== editingId).map(topic => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select></label><label className="field-label">Used for<textarea value={draft.usedFor} onChange={event => updateDraft('usedFor', event.target.value)} rows={3} placeholder="Short purpose or use case" className="focus-input mt-1 resize-none" /></label><label className="main-topic-check"><input type="checkbox" checked={draft.completed} onChange={event => updateDraft('completed', event.target.checked)} /> Mark as completed</label><footer><button type="button" onClick={closePanel} className="subtle-button">Cancel</button><button disabled={saving || !draft.name.trim() || !draft.category} className="primary-button">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add topic'}</button></footer></form>}
      {panel === 'import' && <div><label className="field-label">Import into category<select value={importCategory} onChange={event => setImportCategory(event.target.value)} className="focus-input mt-1"><option value="">Automatic — use each # heading</option>{allCategories.map(category => <option key={category} value={category}>{category}</option>)}</select></label><p className="learning-import-note">{importCategory ? `Everything in this Markdown will be added to ${importCategory}. Headings will only control the topic hierarchy.` : 'Each # heading becomes both the category name and its main topic.'}</p><div className="learning-markdown-help"><code># React</code><span>Main topic</span><code>## Hooks</code><span>Nested section</span><code>- useState — Local state</code><span>Learning item</span></div><textarea autoFocus value={importText} onChange={event => setImportText(event.target.value)} rows={12} placeholder={'# React\n- JSX — Writing HTML-like syntax\n\n## React Hooks\n- useState — Managing local state'} className="focus-input resize-none font-mono text-xs" /><input ref={fileInput} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setImportText(String(reader.result || '')); reader.readAsText(file); }} className="hidden" /><footer><button onClick={() => fileInput.current?.click()} className="subtle-button mr-auto"><Upload className="w-4 h-4" /> Choose file</button><button onClick={closePanel} className="subtle-button">Cancel</button><button disabled={saving || !importText.trim()} onClick={() => void importTopics()} className="primary-button">{saving ? 'Importing…' : 'Import'}</button></footer></div>}
      {panel === 'categories' && <div><form onSubmit={createCategory} className="flex gap-2"><input autoFocus value={newCategory} onChange={event => setNewCategory(event.target.value)} placeholder="New category name" className="focus-input" /><button disabled={saving || !newCategory.trim()} className="primary-button !px-4"><Plus className="w-4 h-4" /> Add</button></form><p className="learning-reorder-hint"><GripVertical className="w-3.5 h-3.5" /> Drag categories to change their order.</p><div className="learning-category-list">{allCategories.map(category => { const categoryTopics = usableTopics.filter(topic => topic.category === category); return <div draggable onDragStart={() => setDraggedCategory(category)} onDragOver={event => event.preventDefault()} onDrop={() => void dropCategory(category)} onDragEnd={() => setDraggedCategory(null)} className={draggedCategory === category ? 'category-filter-dragging' : ''} key={category}>{editingCategory === category ? <form onSubmit={renameCategory} className="learning-category-edit"><input autoFocus value={categoryName} onChange={event => setCategoryName(event.target.value)} className="focus-input !py-2" /><button disabled={saving || !categoryName.trim()} className="primary-button !min-h-9 !px-3">Save</button><button type="button" onClick={() => setEditingCategory(null)} className="subtle-button !min-h-9 !px-3">Cancel</button></form> : <><span><GripVertical className="learning-category-grip" /><i style={{ background: categoryColor(category) }} />{category}</span><div className="learning-category-actions"><small>{categoryTopics.filter(topic => isRootTopic(topic, categoryTopics)).length} main topics</small><button onClick={() => { setEditingCategory(category); setCategoryName(category); setConfirmDeleteCategory(null); }} title={`Rename ${category}`}><Pencil className="w-3.5 h-3.5" /></button>{category !== 'Uncategorized' && <button onClick={() => void removeCategory(category)} className={confirmDeleteCategory === category ? 'learning-category-confirm' : ''} title={`Delete ${category}`}>{confirmDeleteCategory === category ? 'Confirm' : <Trash2 className="w-3.5 h-3.5" />}</button>}</div></>}</div>; })}</div>{confirmDeleteCategory && <p className="learning-delete-note">Deleting this category keeps its topics and moves them to Uncategorized. Click Confirm to continue.</p>}</div>}
    </section></div>}
  </div>;
};
