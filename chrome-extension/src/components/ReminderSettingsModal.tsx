import React, { useRef, useState } from 'react';
import { Bell, BellOff, Check, Clock, Music2, Play, Trash2, Upload, X } from 'lucide-react';
import { DailyGoal, ReminderSettings } from '../types';
import { disablePushReminders, enablePushReminders, getNotificationReadiness, loadReminderSettings, syncGoalWithReminderService } from '../lib/notifications';
import { playSelectedAlarmSound, removeAlarmSound, saveAlarmSound } from '../lib/alarmSound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dailyGoal: DailyGoal | null;
}

export const ReminderSettingsModal: React.FC<Props> = ({ isOpen, onClose, dailyGoal }) => {
  const [settings, setSettings] = useState<ReminderSettings>(() => loadReminderSettings());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const readiness = getNotificationReadiness();

  if (!isOpen) return null;

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await enablePushReminders({ ...settings, enabled: true });
      await syncGoalWithReminderService(dailyGoal);
      setSettings(current => ({ ...current, enabled: true }));
      setMessage('Reminders are active, even when this tab is closed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not enable reminders.');
    } finally {
      setSaving(false);
    }
  };

  const disable = async () => {
    await disablePushReminders();
    setSettings(current => ({ ...current, enabled: false }));
    setMessage('Reminders paused.');
  };

  const chooseSound = async (file?: File) => {
    if (!file) return;
    try {
      const alarmSoundName = await saveAlarmSound(file);
      setSettings(current => ({ ...current, alarmSoundName }));
      setMessage(`“${alarmSoundName}” is saved on this device. Use Test sound to preview it.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save that sound.');
    }
  };

  const testSound = async () => {
    try {
      const played = await playSelectedAlarmSound();
      if (!played) setMessage('Choose an audio file first.');
    } catch {
      setMessage('Your browser could not play this audio file. Try an MP3, WAV, or M4A file.');
    }
  };

  const clearSound = async () => {
    await removeAlarmSound();
    setSettings(current => ({ ...current, alarmSoundName: undefined }));
    setMessage('Custom alarm sound removed from this device.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1f2518]/35 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={onClose}>
      <section className="w-full max-w-md rounded-[28px] bg-white border border-[#dfe5d8] shadow-2xl p-6 sm:p-7" onMouseDown={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-7">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#edf2e8] text-[#4d5f38] flex items-center justify-center"><Bell className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-semibold text-[#20251d]">Accountability reminders</h2>
              <p className="text-sm text-[#727a69] mt-1">A gentle nudge until the work is clear.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-[#7b8274] hover:bg-[#f3f5f0]" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="field-label">Ask for my goal at</span>
            <input type="time" value={settings.morningTime} onChange={e => setSettings({ ...settings, morningTime: e.target.value })} className="focus-input" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="field-label">Repeat until set</span>
              <select value={settings.repeatMinutes} onChange={e => setSettings({ ...settings, repeatMinutes: Number(e.target.value) })} className="focus-input">
                <option value={15}>Every 15 min</option><option value={30}>Every 30 min</option><option value={60}>Every hour</option>
              </select>
            </label>
            <label>
              <span className="field-label">Progress check-ins</span>
              <select value={settings.checkInMinutes} onChange={e => setSettings({ ...settings, checkInMinutes: Number(e.target.value) })} className="focus-input">
                <option value={30}>Every 30 min</option><option value={45}>Every 45 min</option><option value={60}>Every hour</option><option value={120}>Every 2 hours</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="field-label">Stop notifications at</span>
            <input type="time" value={settings.quietTime} onChange={e => setSettings({ ...settings, quietTime: e.target.value })} className="focus-input" />
          </label>

          <div>
            <span className="field-label">Custom alarm sound</span>
            <input ref={fileInput} type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" className="hidden" onChange={event => void chooseSound(event.target.files?.[0])} />
            <div className="mt-1 flex items-center gap-2">
              <button type="button" onClick={() => fileInput.current?.click()} className="focus-input flex items-center justify-center gap-2 text-sm">
                <Upload className="w-4 h-4" /> {settings.alarmSoundName ? 'Replace sound' : 'Choose audio file'}
              </button>
              {settings.alarmSoundName && <>
                <button type="button" onClick={() => void testSound()} className="p-3 rounded-xl border border-[#dfe5d8] text-[#4d5f38] hover:bg-[#f5f7f2]" aria-label="Test custom alarm sound"><Play className="w-4 h-4" /></button>
                <button type="button" onClick={() => void clearSound()} className="p-3 rounded-xl border border-[#dfe5d8] text-[#8b5b45] hover:bg-[#fdf5f1]" aria-label="Remove custom alarm sound"><Trash2 className="w-4 h-4" /></button>
              </>}
            </div>
            {settings.alarmSoundName && <p className="mt-2 text-xs text-[#66705c] flex gap-1.5 items-center"><Music2 className="w-3.5 h-3.5" />{settings.alarmSoundName}</p>}
          </div>

          <div className="rounded-2xl bg-[#f5f7f2] px-4 py-3 flex gap-3 text-xs leading-relaxed text-[#66705c]">
            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Chrome can show reminders even when this new-tab page is closed. They use your device’s notification sound. A custom file can play while Rewise is open, but it cannot play after the page is closed. Silent or Focus modes can still suppress alerts.</p>
          </div>

          {!readiness.supported && <p className="text-sm text-[#8b5b45]">{readiness.message}</p>}

          {message && <p className={`text-sm ${settings.enabled ? 'text-[#4d5f38]' : 'text-[#8b5b45]'}`}>{message}</p>}

          <button onClick={save} disabled={saving || !readiness.supported || readiness.permission === 'denied'} className="primary-button w-full">
            {settings.enabled ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {saving ? 'Activating…' : settings.enabled ? 'Save reminder schedule' : 'Enable Chrome reminders'}
          </button>
          {settings.enabled && <button onClick={disable} className="w-full text-sm text-[#7b8274] hover:text-[#343b2d] flex items-center justify-center gap-2 py-2"><BellOff className="w-4 h-4" /> Pause reminders</button>}
        </div>
      </section>
    </div>
  );
};
