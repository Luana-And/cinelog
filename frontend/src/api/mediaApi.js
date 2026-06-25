const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5189/api/media').replace(/\/$/, '');

async function handle(resp) {
  if (!resp.ok) {
    let msg = `Erro ${resp.status}`;
    try {
      const data = await resp.json();
      msg = data.error || msg;
    } catch {}
    throw new Error(msg);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

export const mediaApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}${qs ? '?' + qs : ''}`).then(handle);
  },

  create: (title, type) =>
    fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type })
    }).then(handle),

  update: (id, rating, notes) =>
    fetch(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, notes })
    }).then(handle),

  remove: (id) =>
    fetch(`${BASE_URL}/${id}`, { method: 'DELETE' }).then(handle),

  analyze: (id) =>
    fetch(`${BASE_URL}/${id}/analyze`, { method: 'POST' }).then(handle),

  stats: () =>
    fetch(`${BASE_URL}/stats`).then(handle)
};
