import { removeClient, requirePost } from './_shared.js';

export default async function handler(req: any, res: any) {
  if (!requirePost(req, res)) return;
  if (req.body?.endpoint) await removeClient(req.body.endpoint);
  res.status(200).json({ ok: true });
}
