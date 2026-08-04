import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, Square, Plus, Trash2, X, ListTodo, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { soundEffects } from '../lib/sound';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

interface TodoWidgetProps {
  soundMuted: boolean;
}

const STORAGE_KEY = 'momentum_quick_todos_v1';

const INITIAL_TODOS: TodoItem[] = [
  { id: 'todo-1', text: 'Complete today\'s revision target', completed: false, createdAt: new Date().toISOString() },
  { id: 'todo-[#todo-2]', text: 'Review weak concepts & notes', completed: false, createdAt: new Date().toISOString() }
];

export const TodoWidget: React.FC<TodoWidgetProps> = ({ soundMuted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_TODOS;
    } catch {
      return INITIAL_TODOS;
    }
  });
  const [newText, setNewText] = useState('');
  const [draggedTodoId, setDraggedTodoId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      console.error('Failed to save todos:', e);
    }
  }, [todos]);

  const handleAddTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newText.trim()) return;

    soundEffects.pop(soundMuted);
    const newItem: TodoItem = {
      id: `todo-${Date.now()}`,
      text: newText.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTodos(prev => [newItem, ...prev]);
    setNewText('');
  };

  const handleToggleTodo = (id: string) => {
    soundEffects.pop(soundMuted);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTodo = (id: string) => {
    soundEffects.delete(soundMuted);
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const handleClearCompleted = () => {
    soundEffects.delete(soundMuted);
    setTodos(prev => prev.filter(t => !t.completed));
  };

  const moveTodo = (id: string, direction: -1 | 1) => {
    setTodos(prev => {
      const currentIndex = prev.findIndex(todo => todo.id === id);
      const nextIndex = currentIndex + direction;

      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;

      const reordered = [...prev];
      [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
      return reordered;
    });
    soundEffects.pop(soundMuted);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedTodoId || draggedTodoId === targetId) {
      setDraggedTodoId(null);
      return;
    }

    setTodos(prev => {
      const sourceIndex = prev.findIndex(todo => todo.id === draggedTodoId);
      const targetIndex = prev.findIndex(todo => todo.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;

      const reordered = [...prev];
      const [movedTodo] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, movedTodo);
      return reordered;
    });
    setDraggedTodoId(null);
    soundEffects.pop(soundMuted);
  };

  const pendingCount = todos.filter(t => !t.completed).length;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-3 w-80 sm:w-96 bg-stone-900/90 backdrop-blur-2xl border border-white/20 text-white rounded-3xl p-4 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl flex items-center justify-center">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                    Focus Todo List
                    {pendingCount > 0 && (
                      <span className="text-[10px] font-bold bg-emerald-500 text-stone-950 px-1.5 py-0.2 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-stone-400">Quick action items for today</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {todos.some(t => t.completed) && (
                  <button
                    onClick={handleClearCompleted}
                    className="text-[10px] font-semibold text-stone-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Clear Done
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddTodo} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="New task..."
                className="flex-1 bg-stone-950/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
              <button
                type="submit"
                disabled={!newText.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white p-1.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Todo Items List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {todos.length === 0 ? (
                <div className="py-6 text-center text-stone-400 text-xs italic">
                  No tasks added yet. Type above to add one!
                </div>
              ) : (
                todos.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggedTodoId(item.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', item.id);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(item.id);
                    }}
                    onDragEnd={() => setDraggedTodoId(null)}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all ${
                      item.completed
                        ? 'bg-stone-950/30 border-white/5 text-stone-500 line-through'
                        : 'bg-stone-950/60 border-white/10 text-stone-100 hover:border-emerald-500/40'
                    } ${draggedTodoId === item.id ? 'opacity-50 border-emerald-400/70' : ''}`}
                  >
                    <div
                      className="flex items-center gap-1 flex-shrink-0 text-stone-500 cursor-grab active:cursor-grabbing"
                      title="Drag to reorder"
                      aria-hidden="true"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                      <span className="w-4 text-center text-[10px] font-bold tabular-nums">{index + 1}.</span>
                    </div>

                    <button
                      onClick={() => handleToggleTodo(item.id)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      {item.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">{item.text}</span>
                    </button>

                    <div className="flex items-center flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveTodo(item.id, -1)}
                        disabled={index === 0}
                        aria-label={`Move ${item.text} up`}
                        title="Move up"
                        className="text-stone-500 hover:text-emerald-300 disabled:opacity-20 disabled:hover:text-stone-500 p-0.5 rounded transition-colors cursor-pointer disabled:cursor-default"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTodo(item.id, 1)}
                        disabled={index === todos.length - 1}
                        aria-label={`Move ${item.text} down`}
                        title="Move down"
                        className="text-stone-500 hover:text-emerald-300 disabled:opacity-20 disabled:hover:text-stone-500 p-0.5 rounded transition-colors cursor-pointer disabled:cursor-default"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTodo(item.id)}
                        aria-label={`Delete ${item.text}`}
                        title="Delete task"
                        className="text-stone-500 hover:text-rose-400 p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom-Right Trigger Button */}
      <button
        onClick={() => {
          soundEffects.pop(soundMuted);
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs shadow-2xl transition-all cursor-pointer backdrop-blur-xl border ${
          isOpen
            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-500/30'
            : 'bg-stone-900/80 hover:bg-stone-900 text-white border-white/20 hover:border-emerald-500/50'
        }`}
      >
        <ListTodo className="w-4 h-4 text-emerald-400" />
        <span>Todo</span>
        {pendingCount > 0 && (
          <span className="w-4 h-4 bg-emerald-500 text-stone-950 font-extrabold text-[10px] rounded-full flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </button>
    </div>
  );
};
