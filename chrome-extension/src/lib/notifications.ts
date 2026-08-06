import { DailyGoal, ReminderSettings } from '../types';

const SETTINGS_KEY = 'revisionReminderSettings';

export type NotificationReadiness = {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  message: string;
};

export const defaultReminderSettings: ReminderSettings = {
  enabled: false,
  morningTime: '08:00',
  repeatMinutes: 30,
  checkInMinutes: 45,
  quietTime: '22:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

export function loadReminderSettings(): ReminderSettings {
  try {
    return { ...defaultReminderSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return defaultReminderSettings;
  }
}

function send(message: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, () => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

export function getNotificationReadiness(): NotificationReadiness {
  if (!('Notification' in window)) return { supported: false, permission: 'unsupported', message: 'Chrome notifications are unavailable.' };
  if (Notification.permission === 'denied') return { supported: true, permission: 'denied', message: 'Allow notifications in this extension’s settings, then try again.' };
  return { supported: true, permission: Notification.permission, message: '' };
}

export async function enablePushReminders(settings: ReminderSettings) {
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission was not granted.');
  }
  const savedSettings = { ...settings, enabled: true };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedSettings));
  await send({ type: 'SAVE_REMINDER_SETTINGS', settings: savedSettings });
}

export async function syncGoalWithReminderService(goal: DailyGoal | null) {
  await send({ type: 'SYNC_DAILY_GOAL', goal });
}

export async function disablePushReminders() {
  const settings = { ...loadReminderSettings(), enabled: false };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  await send({ type: 'SAVE_REMINDER_SETTINGS', settings });
}
