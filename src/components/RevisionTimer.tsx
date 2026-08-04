import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Save, Clock, Timer, Sparkles, Check } from 'lucide-react';
import { formatStopwatch, formatTimeSeconds } from '../lib/timeUtils';
import { soundEffects } from '../lib/sound';

interface RevisionTimerProps {
  totalTimeSeconds?: number;
  onSaveTime: (seconds: number) => void;
  onSaveTimeAndIncrement?: (seconds: number) => void;
  soundMuted?: boolean;
  compact?: boolean;
}

export const RevisionTimer: React.FC<RevisionTimerProps> = ({
  totalTimeSeconds = 0,
  onSaveTime,
  onSaveTimeAndIncrement,
  soundMuted = false,
  compact = false
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.pop(soundMuted);
    setIsRunning((prev) => !prev);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.pop(soundMuted);
    setIsRunning(false);
    setSeconds(0);
  };

  const handleSaveOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (seconds <= 0) return;
    soundEffects.success(soundMuted);
    onSaveTime(seconds);
    setJustSaved(true);
    setIsRunning(false);
    setSeconds(0);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleSaveAndIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.fanfare(soundMuted);
    if (onSaveTimeAndIncrement) {
      onSaveTimeAndIncrement(seconds);
    } else {
      onSaveTime(seconds);
    }
    setJustSaved(true);
    setIsRunning(false);
    setSeconds(0);
    setTimeout(() => setJustSaved(false), 2000);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-amber-100/90 border-2 border-amber-950 rounded-xl px-2.5 py-1 text-xs font-bold text-amber-950 shadow-[1px_1px_0px_#451a03]">
        <Clock className="w-3.5 h-3.5 text-amber-800" />
        <span>{formatTimeSeconds(totalTimeSeconds + seconds)}</span>
        {isRunning && (
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-amber-100/80 border-2 border-amber-950 rounded-2xl p-3 shadow-[2px_2px_0px_#451a03] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs uppercase tracking-wider">
          <Timer className="w-4 h-4 text-amber-800" />
          <span>Revision Round Timer</span>
        </div>
        <div className="text-[11px] font-extrabold text-amber-900/80">
          Total Spent: <span className="text-amber-950 font-black">{formatTimeSeconds(totalTimeSeconds)}</span>
        </div>
      </div>

      {/* Stopwatch Display */}
      <div className="flex items-center justify-between bg-white border-2 border-amber-950 rounded-xl px-3 py-2 shadow-[ inset_0_2px_4px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="font-mono text-xl font-black text-amber-950 tracking-wider">
            {formatStopwatch(seconds)}
          </span>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggle}
            className={`px-2.5 py-1 rounded-lg border-2 border-amber-950 font-black text-xs flex items-center gap-1 transition-all shadow-[1px_1px_0px_#451a03] ${
              isRunning 
                ? 'bg-amber-300 hover:bg-amber-400 text-amber-950' 
                : 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                {seconds > 0 ? 'Resume' : 'Start'}
              </>
            )}
          </button>

          {seconds > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 border-2 border-amber-950 text-amber-900"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons to save logged duration */}
      {seconds > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSaveOnly}
            className="flex-1 bg-white hover:bg-amber-200 text-amber-950 font-extrabold text-xs py-1.5 px-2 rounded-xl border-2 border-amber-950 shadow-[1px_1px_0px_#451a03] flex items-center justify-center gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            Save {formatStopwatch(seconds)}
          </button>

          {onSaveTimeAndIncrement && (
            <button
              type="button"
              onClick={handleSaveAndIncrement}
              className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-black text-xs py-1.5 px-2 rounded-xl border-2 border-amber-950 shadow-[1px_1px_0px_#451a03] flex items-center justify-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Log & +1 Rev
            </button>
          )}
        </div>
      )}

      {justSaved && (
        <div className="text-[11px] font-black text-emerald-800 flex items-center justify-center gap-1 bg-emerald-100 p-1 rounded-lg border border-emerald-950">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          Time Logged Successfully!
        </div>
      )}
    </div>
  );
};
