import { reminderServiceReady } from './_config.js';

export default function handler(_req: any, res: any) {
  if (!reminderServiceReady()) return res.status(503).json({ ready: false, error: 'Reminders are not configured on this deployment. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT in Vercel Environment Variables, then redeploy.' });
  res.status(200).json({ ready: true, persistentStore: true });
}
