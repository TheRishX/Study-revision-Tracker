import { reminderServiceReady } from './_config.js';

export default function handler(_req: any, res: any) {
  if (!reminderServiceReady()) return res.status(503).json({ error: 'Reminders are not configured on this deployment. Contact the site owner.' });
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}
