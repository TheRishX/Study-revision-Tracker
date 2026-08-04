import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, ChevronDown, CirclePause, Flame, Play, Plus, RotateCcw, Sparkles, Target } from 'lucide-react';
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

export const OverviewDashboard: React.FC<Props> = ({
  videos, dailyGoal, streakDays, onNavigateToTopics, onOpenAddModal, onSaveDailyGoal, onCompleteDailyGoal,
}) => {
  const [intent, setIntent] = useState('');
  const [videoId, setVideoId] = useState('');
  const [targetMinutes, setTargetMinutes] = useState(45);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const linkedVideo = videos.find(video => video.id === dailyGoal?.videoId);
  const today = useMemo(() => new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const saveGoal = (event: React.FormEvent) => {
    event.preventDefault();
    const selected = videos.find(video => video.id === videoId);
    const cleanIntent = intent.trim() || selected?.title;
    if (!cleanIntent) return;
    onSaveDailyGoal({
      dateStr: new Date().toISOString().split('T')[0],
      videoId: videoId || undefined,
      intent: cleanIntent,
      targetMinutes,
      status: 'not_started',
      completed: false,
    });
  };

  const setStatus = (status: DailyGoal['status']) => {
    if (!dailyGoal) return;
    onSaveDailyGoal({ ...dailyGoal, status, lastCheckInAt: new Date().toISOString() });
    setRunning(status === 'learning');
  };

  if (!dailyGoal) {
    return (
      <div className="focus-page">
        <div className="w-full max-w-2xl mx-auto">
          <div className="mb-10 text-center sm:text-left">
            <p className="eyebrow">{today}</p>
            <h1 className="display-title mt-3">What will you learn today?</h1>
            <p className="mt-3 text-[#737a6c] text-base">One clear outcome. Everything else can wait.</p>
          </div>

          <form onSubmit={saveGoal} className="goal-card space-y-6">
            <label className="block">
              <span className="field-label">Today's outcome</span>
              <input autoFocus value={intent} onChange={e => setIntent(e.target.value)} placeholder="e.g. Explain Dijkstra's algorithm from memory" className="goal-input" />
            </label>

            <div className="grid sm:grid-cols-[1fr_160px] gap-4">
              <label className="block">
                <span className="field-label">Link a revision topic <span className="font-normal normal-case tracking-normal">(optional)</span></span>
                <div className="relative">
                  <select value={videoId} onChange={e => { setVideoId(e.target.value); if (!intent && e.target.value) setIntent(videos.find(v => v.id === e.target.value)?.title || ''); }} className="focus-input appearance-none pr-9">
                    <option value="">No linked topic</option>
                    {videos.map(video => <option key={video.id} value={video.id}>{video.title}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#899080]" />
                </div>
              </label>
              <label className="block">
                <span className="field-label">Focus time</span>
                <select value={targetMinutes} onChange={e => setTargetMinutes(Number(e.target.value))} className="focus-input">
                  <option value={25}>25 minutes</option><option value={45}>45 minutes</option><option value={60}>60 minutes</option><option value={90}>90 minutes</option>
                </select>
              </label>
            </div>

            <button disabled={!intent.trim() && !videoId} className="primary-button w-full sm:w-auto">Set today's goal <ArrowRight className="w-4 h-4" /></button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-[#7c8474]">
            <button type="button" onClick={onNavigateToTopics} className="hover:text-[#4d5f38] flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Browse topics</button>
            <span className="text-[#d5dacd]">•</span>
            <button type="button" onClick={onOpenAddModal} className="hover:text-[#4d5f38] flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add topic</button>
          </div>
        </div>
      </div>
    );
  }

  const completed = dailyGoal.completed || dailyGoal.status === 'completed';
  return (
    <div className="focus-page">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="eyebrow">Today's focus</p>
            <p className="text-sm text-[#808779] mt-1">{today}</p>
          </div>
          <button onClick={onNavigateToTopics} className="subtle-button"><BookOpen className="w-4 h-4" /> Topics</button>
        </div>

        <section className={`goal-card ${completed ? 'bg-[#f5f7f2]' : ''}`}>
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${completed ? 'bg-[#4d5f38] text-white' : 'bg-[#edf2e8] text-[#4d5f38]'}`}>
              {completed ? <Check className="w-5 h-5" /> : <Target className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#899080]">{completed ? 'Done for today' : 'Your one outcome'}</p>
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.035em] text-[#20251d] mt-2 leading-tight">{dailyGoal.intent || linkedVideo?.title}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-[#747c6d]">
                <span>{dailyGoal.targetMinutes || 45} min target</span>
                {linkedVideo && <span>Revision {linkedVideo.revisionCount + 1} of {linkedVideo.targetRevisionCount || 5}</span>}
                <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-[#8a6b43]" /> {streakDays} day streak</span>
              </div>
            </div>
          </div>

          {!completed && (
            <>
              <div className="my-8 h-px bg-[#e5e8df]" />
              <div className="text-center py-2">
                <div className="font-mono text-5xl sm:text-6xl tracking-[-0.04em] text-[#293023] tabular-nums">{formatTimer(seconds)}</div>
                <p className="text-xs text-[#8b9283] mt-2">Focused time today</p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
                {dailyGoal.status !== 'learning' ? (
                  <button onClick={() => setStatus('learning')} className="primary-button"><Play className="w-4 h-4 fill-current" /> {seconds ? 'Continue learning' : 'Start learning'}</button>
                ) : (
                  <button onClick={() => setStatus('paused')} className="subtle-button justify-center"><CirclePause className="w-4 h-4" /> Pause</button>
                )}
                <button onClick={() => { setRunning(false); onCompleteDailyGoal(linkedVideo); }} className="subtle-button justify-center"><Check className="w-4 h-4" /> Mark complete</button>
              </div>
            </>
          )}

          {completed && <p className="mt-6 text-[#66705c] flex items-center gap-2"><Sparkles className="w-4 h-4" /> Small consistent wins become mastery.</p>}
        </section>

        <div className="mt-5 flex justify-between items-center text-sm">
          <p className="text-[#7d8576]">Status: <span className="font-medium text-[#4d5f38] capitalize">{dailyGoal.status?.replace('_', ' ') || 'not started'}</span></p>
          <button onClick={() => { setSeconds(0); setRunning(false); onSaveDailyGoal({ ...dailyGoal, completed: false, completedAt: undefined, status: 'not_started' }); }} className="text-[#858c7e] hover:text-[#4d5f38] flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
        </div>
      </div>
    </div>
  );
};
