import { findClient, requirePost, saveClient } from './_shared.js';

export default async function handler(req: any, res: any) {
  if (!requirePost(req, res)) return;
  const client = await findClient(req.body?.endpoint || '');
  if (client) {
    client.goal = req.body.goal || null;
    client.lastGoalPromptAt = undefined;
    client.lastCheckInAt = Date.now();
    await saveClient(client);
  }
  res.status(200).json({ ok: true });
}
