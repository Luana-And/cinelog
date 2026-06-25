export default async function handler(req, res) {
  const room = (req.query.room || '').toString().trim().toLowerCase();

  if (!room) {
    res.status(400).json({ error: 'room is required' });
    return;
  }

  if (!globalThis.__CINELOG_SYNC_STORE__) {
    globalThis.__CINELOG_SYNC_STORE__ = {};
  }

  const store = globalThis.__CINELOG_SYNC_STORE__;
  if (!store[room]) store[room] = [];

  if (req.method === 'GET') {
    res.status(200).json({ items: store[room] });
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      store[room] = Array.isArray(body.items) ? body.items : [];
      res.status(200).json({ success: true, items: store[room] });
    } catch (error) {
      res.status(400).json({ error: 'invalid payload' });
    }
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
