import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Archive, Check, Clock3, History, Pencil, Plus, Sparkles, Sun, Trash2, X } from 'lucide-react';

interface PlanTask { id: string; title: string; startTime: string; completed: boolean; }
interface DayPlan { id: string; date: string; tasks: PlanTask[]; createdAt: string; archivedAt?: string; }
interface Props { onMoveTaskToToday?: (task: Pick<PlanTask, 'title' | 'startTime'>) => Promise<void>; }

const ACTIVE_KEY = 'rewise-tomorrow-plan';
const ARCHIVE_KEY = 'rewise-tomorrow-plan-archive';
const id = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const tomorrowDate = () => { const date = new Date(); date.setDate(date.getDate() + 1); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const newTask = (startTime = ''): PlanTask => ({ id: id(), title: '', startTime, completed: false });
const newPlan = (): DayPlan => ({ id: id(), date: tomorrowDate(), tasks: [newTask('08:00'), newTask('11:00')], createdAt: new Date().toISOString() });
const read = <T,>(key: string, fallback: T): T => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } };
const formatTime = (value: string) => {
  if (!value) return 'Choose a time';
  const [hours, minutes] = value.split(':').map(Number);
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(2000, 0, 1, hours, minutes));
};

export const TomorrowPlanPage: React.FC<Props> = ({ onMoveTaskToToday }) => {
  const [plan, setPlan] = useState<DayPlan>(() => read(ACTIVE_KEY, newPlan()));
  const [archives, setArchives] = useState<DayPlan[]>(() => read(ARCHIVE_KEY, []));
  const [showArchive, setShowArchive] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const namedTasks = plan.tasks.filter(task => task.title.trim());
  const completed = namedTasks.filter(task => task.completed).length;
  const progress = namedTasks.length ? Math.round((completed / namedTasks.length) * 100) : 0;
  const readyToArchive = namedTasks.length >= 2 && completed === namedTasks.length;
  const formattedDate = useMemo(() => new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${plan.date}T12:00:00`)), [plan.date]);

  useEffect(() => { localStorage.setItem(ACTIVE_KEY, JSON.stringify(plan)); }, [plan]);
  useEffect(() => { localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives)); }, [archives]);

  const updateTask = (taskId: string, updates: Partial<PlanTask>) => setPlan(current => ({ ...current, tasks: current.tasks.map(task => task.id === taskId ? { ...task, ...updates } : task) }));
  const addTask = () => {
    if (plan.tasks.length >= 4) return;
    const task = newTask();
    setPlan(current => ({ ...current, tasks: [...current.tasks, task] }));
    setEditingTaskId(task.id);
  };
  const removeTask = (taskId: string) => {
    if (plan.tasks.length <= 2) return;
    setPlan(current => ({ ...current, tasks: current.tasks.filter(task => task.id !== taskId) }));
    setEditingTaskId(current => current === taskId ? null : current);
  };
  const saveTask = (task: PlanTask) => {
    const title = task.title.trim();
    if (!title) return;
    updateTask(task.id, { title });
    setEditingTaskId(null);
  };
  const moveTaskToToday = async (task: PlanTask) => {
    if (!onMoveTaskToToday || movingTaskId) return;
    setMovingTaskId(task.id);
    try {
      await onMoveTaskToToday({ title: task.title, startTime: task.startTime });
      setPlan(current => {
        const tasks = current.tasks.filter(item => item.id !== task.id);
        while (tasks.length < 2) tasks.push(newTask());
        return { ...current, tasks };
      });
      setEditingTaskId(null);
    } finally {
      setMovingTaskId(null);
    }
  };
  const archivePlan = () => {
    if (!readyToArchive) return;
    const archived = { ...plan, tasks: namedTasks, archivedAt: new Date().toISOString() };
    setArchives(current => [archived, ...current].slice(0, 30));
    const freshPlan = newPlan();
    setPlan(freshPlan);
    setEditingTaskId(null);
    confetti({ particleCount: 90, spread: 65, origin: { y: .72 }, colors: ['#6f8055', '#d6b86a', '#ffffff'] });
  };
  const encouragement = progress === 100 ? 'You kept your word. Archive the win.' : progress >= 50 ? 'Momentum is building. Finish clean.' : namedTasks.length >= 2 ? 'Tomorrow already has direction.' : 'Choose two meaningful wins for tomorrow.';

  return <div className="tomorrow-page pb-16">
    <header className="tomorrow-hero">
      <div><p className="eyebrow">Plan with intention</p><h1>Tomorrow</h1><p>{formattedDate} · Start times only. Give the work the time it deserves.</p></div>
      <button onClick={() => setShowArchive(true)} className="subtle-button !min-h-9 text-xs"><History className="w-4 h-4" /> Archive <span className="tomorrow-archive-count">{archives.length}</span></button>
    </header>

    <section className="tomorrow-mission">
      <div className="tomorrow-progress" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}><div><strong>{progress}%</strong><span>done</span></div></div>
      <div><span className="tomorrow-kicker"><Sparkles className="w-3.5 h-3.5" /> Tomorrow’s mission</span><h2>{encouragement}</h2><p>{completed} of {namedTasks.length || 2} meaningful tasks completed</p></div>
    </section>

    <div className="tomorrow-task-list">
      {plan.tasks.map((task, index) => {
        const isEditing = editingTaskId === task.id || !task.title.trim();
        return <article key={task.id} className={`tomorrow-task ${task.completed ? 'tomorrow-task-complete' : ''} ${isEditing ? 'tomorrow-task-editing' : ''}`}>
        <button type="button" onClick={() => task.title.trim() && updateTask(task.id, { completed: !task.completed })} className="tomorrow-check" aria-label={`Mark task ${index + 1} complete`} disabled={!task.title.trim()}>{task.completed && <Check className="w-4 h-4" />}</button>
        <div className="tomorrow-task-number">0{index + 1}</div>
        {isEditing ? <form id={`tomorrow-task-form-${task.id}`} className="tomorrow-task-content" onSubmit={event => { event.preventDefault(); saveTask(task); }}><label>What must get done?<input autoFocus value={task.title} onChange={event => updateTask(task.id, { title: event.target.value, completed: event.target.value.trim() ? task.completed : false })} placeholder={index === 0 ? 'Your most important win…' : 'One clear, finishable task…'} maxLength={120} /></label><label className="tomorrow-time"><Clock3 className="w-4 h-4" /><span>Start at</span><input type="time" value={task.startTime} onChange={event => updateTask(task.id, { startTime: event.target.value })} aria-label={`Task ${index + 1} start time`} /></label></form> : <div className="tomorrow-task-content tomorrow-task-readonly"><div><span>Planned task</span><strong>{task.title}</strong></div><div className="tomorrow-time-display"><Clock3 className="w-4 h-4" /><span>Start at</span><strong>{formatTime(task.startTime)}</strong></div></div>}
        <div className="tomorrow-task-controls">{isEditing ? <button type="submit" form={`tomorrow-task-form-${task.id}`} className="tomorrow-save" disabled={!task.title.trim()} aria-label={`Save task ${index + 1}`} title="Save task"><Check className="w-4 h-4" /></button> : <><button type="button" onClick={() => void moveTaskToToday(task)} disabled={!onMoveTaskToToday || movingTaskId === task.id} className="tomorrow-move-today" aria-label={`Move ${task.title} to Today`} title="Move to Today"><Sun className="w-4 h-4" /></button><button type="button" onClick={event => { event.preventDefault(); event.stopPropagation(); setEditingTaskId(task.id); }} className="tomorrow-edit" aria-label={`Edit task ${index + 1}`} title="Edit task"><Pencil className="w-4 h-4" /></button></>}{plan.tasks.length > 2 && <button type="button" onClick={() => removeTask(task.id)} className="tomorrow-remove" title="Remove task"><Trash2 className="w-4 h-4" /></button>}</div>
      </article>})}
    </div>

    <footer className="tomorrow-actions">
      <button onClick={addTask} disabled={plan.tasks.length >= 4} className="subtle-button disabled:opacity-40"><Plus className="w-4 h-4" /> {plan.tasks.length >= 4 ? 'Four is enough—protect your focus' : 'Add another task'}</button>
      <button onClick={archivePlan} disabled={!readyToArchive} className="tomorrow-archive-button"><Archive className="w-4 h-4" /> Complete day & start fresh</button>
    </footer>
    <p className="tomorrow-rule">Two to four tasks. No crowded list. No fake end times. Just a clear place to begin.</p>

    {showArchive && <div className="learning-modal-backdrop" onMouseDown={event => event.target === event.currentTarget && setShowArchive(false)}><section className="learning-modal tomorrow-archive-modal" role="dialog" aria-modal="true"><header><div><h2>Completed plans</h2><p>A quiet record of days when you followed through.</p></div><button onClick={() => setShowArchive(false)} className="icon-button"><X className="w-4 h-4" /></button></header>{archives.length ? <div className="tomorrow-history">{archives.map(item => <article key={item.id}><div><strong>{new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${item.date}T12:00:00`))}</strong><span>{item.tasks.length} wins</span></div><ol>{item.tasks.map(task => <li key={task.id}><time>{formatTime(task.startTime)}</time>{task.title}</li>)}</ol></article>)}</div> : <div className="mern-empty">Your completed plans will live here.</div>}</section></div>}
  </div>;
};
