import { dispatchReminders } from '../notifications/_shared.js';

export default async function handler(req: any, res: any) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || req.headers.authorization !== `Bearer ${expectedSecret}`) return res.status(401).json({ error: 'Unauthorized' });
  try {
    res.status(200).json({ ok: true, delivered: await dispatchReminders() });
  } catch (error: any) {
    console.error('Reminder cron failed:', error?.message || error);
    res.status(500).json({ error: 'Reminder dispatch failed.' });
  }
}
