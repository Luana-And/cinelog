const STORAGE_KEY = 'cinelog-items-v1';

function readItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function normalize(item) {
  return {
    id: Number(item.id),
    title: item.title,
    type: item.type,
    rating: Number(item.rating || 0),
    notes: item.notes || '',
    createdAt: item.createdAt || new Date().toISOString()
  };
}

export const mediaApi = {
  getAll: () => Promise.resolve(readItems().map(normalize)),

  create: (title, type) => {
    const items = readItems();
    const item = normalize({
      id: nextId(items),
      title,
      type,
      rating: 0,
      notes: '',
      createdAt: new Date().toISOString()
    });
    items.unshift(item);
    writeItems(items);
    return Promise.resolve(item);
  },

  update: (id, rating, notes) => {
    const items = readItems();
    const item = items.find(i => Number(i.id) === Number(id));
    if (!item) return Promise.reject(new Error('Item não encontrado'));
    item.rating = Number(rating || 0);
    item.notes = notes || '';
    writeItems(items);
    return Promise.resolve(normalize(item));
  },

  remove: (id) => {
    const items = readItems().filter(i => Number(i.id) !== Number(id));
    writeItems(items);
    return Promise.resolve(null);
  },

  analyze: (id) => {
    const items = readItems();
    const item = items.find(i => Number(i.id) === Number(id));
    if (!item) return Promise.reject(new Error('Item não encontrado'));

    const typeLabel = item.type === 'filme' ? 'filme' : 'série';
    const analysis = `Análise rápida para ${typeLabel} "${item.title}": este título tem um perfil interessante para sua lista. ${item.notes ? 'Suas anotações mostram uma boa direção para acompanhar seu gosto.' : 'Adicione anotações para enriquecer a análise.'}`;
    return Promise.resolve({ analysis });
  },

  stats: () => {
    const items = readItems().map(normalize);
    const movies = items.filter(i => i.type === 'filme').length;
    const series = items.filter(i => i.type === 'série').length;
    const avgRating = items.length
      ? (items.reduce((sum, i) => sum + i.rating, 0) / items.length).toFixed(1)
      : '—';
    return Promise.resolve({ total: items.length, movies, series, avgRating });
  }
};
