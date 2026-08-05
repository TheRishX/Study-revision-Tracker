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

export function getNotificationReadiness(): NotificationReadiness {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, permission: 'unsupported', message: 'This browser does not support notifications. Try the installed app in Chrome, Edge, or Safari on a supported device.' };
  }
  if (!window.isSecureContext) {
    return { supported: false, permission: Notification.permission, message: 'Notifications require HTTPS (localhost is allowed while developing).' };
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { supported: false, permission: Notification.permission, message: 'Background push is unavailable in this browser. Install the app or use a browser that supports web push.' };
  }
  if (Notification.permission === 'denied') {
    return { supported: true, permission: 'denied', message: 'Notifications are blocked. Allow them in this site’s browser settings, then try again.' };
  }
  return { supported: true, permission: Notification.permission, message: '' };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function enablePushReminders(settings: ReminderSettings) {
  const readiness = getNotificationReadiness();
  if (!readiness.supported) throw new Error(readiness.message);
  if (readiness.permission === 'denied') throw new Error(readiness.message);

  const statusResponse = await fetch('/api/notifications/status');
  if (!statusResponse.ok) {
    const detail = await statusResponse.json().catch(() => null);
    throw new Error(detail?.error || 'The reminder service is unavailable. Please try again shortly.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');

  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  const keyResponse = await fetch('/api/notifications/public-key');
  if (!keyResponse.ok) {
    const detail = await keyResponse.json().catch(() => null);
    throw new Error(detail?.error || 'The reminder service is unavailable. Please try again shortly.');
  }
  const { publicKey } = await keyResponse.json();
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const response = await fetch('/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription, settings }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Could not save reminder settings.');
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, enabled: true }));
}

export async function syncGoalWithReminderService(goal: DailyGoal | null) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await fetch('/api/notifications/goal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      goal: goal ? {
        dateStr: goal.dateStr,
        title: goal.intent,
        status: goal.status,
        completed: goal.completed,
      } : null,
    }),
  });
}

export async function disablePushReminders() {
  const settings = { ...loadReminderSettings(), enabled: false };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
  }
}
