import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, CirclePause, Flame, Play, Plus, Sparkles, Target } from 'lucide-react';
import { DailyGoal, VideoProject } from '../types';

interface Props {
  videos: VideoProject[];
  dailyGoal: DailyGoal | null;
  streakDays: number;
  onNavigateToTopics: () => void;
  onOpenAddModal: () => void;
  onSaveDailyGoal: (goal: DailyGoal) => void;
  onCompleteDailyGoal: (video?: VideoProject) => void;
}

const formatTimer = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
const localDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const FREE_WALLPAPERS = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=88',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=88',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=2400&q=88',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=2400&q=88',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2400&q=88',
];

export const OverviewDashboard: React.FC<Props> = ({
  videos, dailyGoal, streakDays, onNavigateToTopics, onOpenAddModal, onSaveDailyGoal, onCompleteDailyGoal,
}) => {
  const [intent, setIntent] = useState('');
  const [videoId, setVideoId] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(45);
  const timerKey = `focusTimer_${localDateKey()}`;
  const [seconds, setSeconds] = useState(() => Number(localStorage.getItem(timerKey)) || 0);
  const [running, setRunning] = useState(false);
  const linkedVideo = videos.find(video => video.id === dailyGoal?.videoId);
  const today = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), []);
  const yearStats = useMemo(() => {
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(cursor.getFullYear(), 11, 31);
    let daysLeft = 0;
    let focusedDays = 0;
    while (cursor <= end) {
      daysLeft += 1;
      if (cursor.getDay() !== 0) focusedDays += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    return { daysLeft, focusedDays };
  }, []);
  const wallpaper = useMemo(() => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86_400_000);
    return FREE_WALLPAPERS[dayOfYear % FREE_WALLPAPERS.length];
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    localStorage.setItem(timerKey, String(seconds));
  }, [seconds, timerKey]);

  const saveGoal = (event: React.FormEvent) => {
    event.preventDefault();
    const selected = videos.find(video => video.id === videoId);
    const cleanIntent = intent.trim() || selected?.title;
    if (!cleanIntent) return;
    onSaveDailyGoal({ dateStr: localDateKey(), videoId: videoId || undefined, intent: cleanIntent, targetMinutes, status: 'not_started', completed: false });
  };

  const setStatus = (status: DailyGoal['status']) => {
    if (!dailyGoal) return;
    onSaveDailyGoal({ ...dailyGoal, status, lastCheckInAt: new Date().toISOString() });
    setRunning(status === 'learning');
  };

  const completed = Boolean(dailyGoal?.completed || dailyGoal?.status === 'completed');
  const targetSeconds = (dailyGoal?.targetMinutes || targetMinutes) * 60;
  const progress = completed ? 1 : Math.min(1, seconds / targetSeconds);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="momentum-page" style={{ backgroundImage: `url(${wallpaper})` }}>
      <div className="momentum-backdrop" />
      <div className="relative z-10 min-h-[calc(100vh-65px)] flex flex-col px-4 sm:px-8 py-5 sm:py-7 text-white">
        <div className="mx-auto w-full max-w-5xl flex items-center justify-between gap-4 pr-24 sm:pr-32">
          <p className="text-xs sm:text-sm font-medium text-white/80">{today}</p>
          <p className="text-[11px] sm:text-xs text-white/75 text-right">
            <strong className="text-white">{yearStats.daysLeft}</strong> days left this year · <strong className="text-white">{yearStats.focusedDays}</strong> without Sundays
          </p>
        </div>

        <main className="flex-1 flex items-center justify-center py-10 sm:py-14">
          {!dailyGoal ? (
            <div className="w-full max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">One day closer to your engineering career</p>
              <h1 className="momentum-title mt-4">What will you master today?</h1>
              <p className="text-sm sm:text-base text-white/75 mt-3">Choose one meaningful outcome. Give it your full attention.</p>

              <form onSubmit={saveGoal} className="momentum-panel mt-8 text-left space-y-5">
                <label className="block">
                  <span className="momentum-label">Today’s outcome</span>
                  <input autoFocus value={intent} onChange={event => setIntent(event.target.value)} placeholder="Explain React rendering from memory" className="momentum-goal-input" />
                </label>
                <div className="grid sm:grid-cols-[1fr_150px] gap-3">
                  <label>
                    <span className="momentum-label">Revision topic</span>
                    <div className="relative">
                      <select value={videoId} onChange={event => { setVideoId(event.target.value); if (!intent && event.target.value) setIntent(videos.find(video => video.id === event.target.value)?.title || ''); }} className="momentum-input appearance-none pr-9">
                        <option value="">No linked topic</option>
                        {videos.map(video => <option key={video.id} value={video.id}>{video.title}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/60" />
                    </div>
                  </label>
                  <label>
                    <span className="momentum-label">Focus time</span>
                    <select value={targetMinutes} onChange={event => setTargetMinutes(Number(event.target.value))} className="momentum-input">
                      <option value={25}>25 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={90}>90 minutes</option>
                    </select>
                  </label>
                </div>
                <button disabled={!intent.trim() && !videoId} className="momentum-primary w-full sm:w-auto">Set today’s goal <ArrowRight className="w-4 h-4" /></button>
              </form>

              <div className="mt-5 flex justify-center gap-5 text-xs text-white/65">
                <button type="button" onClick={onNavigateToTopics} className="hover:text-white flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Browse topics</button>
                <button type="button" onClick={onOpenAddModal} className="hover:text-white flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add topic</button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">{completed ? 'Today’s promise kept' : 'Your one focus'}</p>
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.04em] leading-tight mt-3 drop-shadow-lg">{dailyGoal.intent || linkedVideo?.title}</h1>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3 text-xs text-white/70">
                <span>{dailyGoal.targetMinutes || 45} minute target</span>
                {linkedVideo && <span>Revision {linkedVideo.revisionCount + 1}/{linkedVideo.targetRevisionCount || 5}</span>}
                <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-300" /> {streakDays} day streak</span>
              </div>

              <div className={`focus-ring mx-auto mt-8 ${running ? 'focus-ring-running' : ''}`}>
                <svg viewBox="0 0 208 208" className="w-full h-full -rotate-90" aria-hidden="true">
                  <circle cx="104" cy="104" r={radius} className="focus-ring-track" />
                  <circle cx="104" cy="104" r={radius} className="focus-ring-progress" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {completed ? <Check className="w-11 h-11 text-white" /> : <span className="font-mono text-4xl sm:text-5xl tracking-[-0.05em] tabular-nums">{formatTimer(seconds)}</span>}
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/60 mt-2">{completed ? 'Completed' : running ? 'Deep focus' : 'Ready'}</span>
                </div>
              </div>

              {!completed ? (
                <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
                  {dailyGoal.status !== 'learning' ? (
                    <button onClick={() => setStatus('learning')} className="momentum-primary"><Play className="w-4 h-4 fill-current" /> {seconds ? 'Continue focus' : 'Start focus'}</button>
                  ) : (
                    <button onClick={() => setStatus('paused')} className="momentum-secondary"><CirclePause className="w-4 h-4" /> Pause</button>
                  )}
                  <button onClick={() => { setRunning(false); onCompleteDailyGoal(linkedVideo); }} className="momentum-secondary"><Check className="w-4 h-4" /> Mark complete</button>
                </div>
              ) : <p className="mt-7 text-sm text-white/80 flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> Consistency is how exceptional careers are built.</p>}

              <button onClick={onNavigateToTopics} className="mt-6 text-xs text-white/60 hover:text-white inline-flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Open revision topics</button>
            </div>
          )}
        </main>

        <p className="text-center text-[11px] sm:text-xs text-white/55">Build quietly. Learn deeply. Let your work open the right doors.</p>
      </div>
    </div>
  );
};
