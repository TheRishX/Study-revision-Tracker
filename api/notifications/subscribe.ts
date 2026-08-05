import { requirePost, saveClient } from './_shared';

export default async function handler(req: any, res: any) {
  if (!requirePost(req, res)) return;
  const { subscription, settings } = req.body || {};
  if (!subscription?.endpoint || !settings?.timezone) return res.status(400).json({ error: 'Invalid reminder subscription.' });
  await saveClient({ subscription, settings: { ...settings, enabled: true }, goal: null });
  res.status(200).json({ ok: true });
}
