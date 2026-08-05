import { createHash } from 'node:crypto';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';
import webpush from 'web-push';
import { reminderServiceReady } from './_config.js';

export { reminderServiceReady } from './_config.js';

export type ReminderClient = {
  subscription: webpush.PushSubscription;
  settings: { enabled: boolean; morningTime: string; repeatMinutes: number; checkInMinutes: number; quietTime: string; timezone: string };
  goal: null | { dateStr: string; title?: string; status?: string; completed?: boolean };
  lastGoalPromptAt?: number;
  lastCheckInAt?: number;
};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyCOkyB2QJ1wmEEOXvOCpfzrGK5XZeFqprk',
  projectId: process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0617388884',
};
const databaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID || 'ai-studio-revisiontracker-018d1dd4-2b3e-434e-aa6c-b7288bdc0261';
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app, databaseId);
const clients = collection(db, 'reminderClients');

function clientId(endpoint: string) {
  return createHash('sha256').update(endpoint).digest('hex');
}

function pushService() {
  if (!reminderServiceReady()) throw new Error('Reminders are not configured on this deployment. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in Vercel Environment Variables, then redeploy.');
  webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  return webpush;
}

export function requirePost(req: any, res: any) {
  if (req.method === 'POST') return true;
  res.setHeader('Allow', 'POST');
  res.status(405).json({ error: 'Method not allowed' });
  return false;
}

export async function saveClient(client: ReminderClient) {
  await setDoc(doc(clients, clientId(client.subscription.endpoint)), client);
}

export async function removeClient(endpoint: string) {
  await deleteDoc(doc(clients, clientId(endpoint)));
}

export async function findClient(endpoint: string): Promise<ReminderClient | null> {
  const snapshot = await getDocs(clients);
  return snapshot.docs.map(item => item.data() as ReminderClient).find(item => item.subscription?.endpoint === endpoint) || null;
}

function dateAndMinutes(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value || '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMinutes = (value: string) => value.split(':').map(Number).reduce((hours, minutes) => hours * 60 + minutes);

export async function dispatchReminders() {
  const push = pushService();
  const now = Date.now();
  const snapshot = await getDocs(clients);
  let delivered = 0;
  await Promise.all(snapshot.docs.map(async item => {
    const client = item.data() as ReminderClient;
    if (!client.settings?.enabled || !client.subscription?.endpoint) return;
    try {
      const local = dateAndMinutes(client.settings.timezone);
      if (local.minutes < toMinutes(client.settings.morningTime) || local.minutes >= toMinutes(client.settings.quietTime)) return;
      const hasGoalToday = client.goal?.dateStr === local.date;
      let payload: Record<string, string> | null = null;
      if (!hasGoalToday && (!client.lastGoalPromptAt || now - client.lastGoalPromptAt >= client.settings.repeatMinutes * 60_000)) {
        payload = { title: 'What will you learn today?', body: 'Choose one clear outcome before the day chooses for you.', tag: `morning-goal-${local.date}`, url: '/' };
        client.lastGoalPromptAt = now;
      } else if (hasGoalToday && !client.goal?.completed && (!client.lastCheckInAt || now - client.lastCheckInAt >= client.settings.checkInMinutes * 60_000)) {
        payload = { title: client.goal?.status === 'learning' ? 'Still learning?' : 'Ready to make progress?', body: client.goal?.title ? `Today: ${client.goal.title}` : 'Open your goal and update your status.', tag: `progress-check-${local.date}`, url: '/' };
        client.lastCheckInAt = now;
      }
      if (!payload) return;
      await push.sendNotification(client.subscription, JSON.stringify(payload));
      await setDoc(item.ref, client);
      delivered += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) await deleteDoc(item.ref);
      else console.error('Reminder delivery failed:', error?.message || error);
    }
  }));
  return delivered;
}
