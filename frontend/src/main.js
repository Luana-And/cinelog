import './styles/style.css';
import { mediaApi } from './api/mediaApi.js';

let items = [];
let currentFilter = 'todos';

const grid = document.getElementById('grid');
const titleInput = document.getElementById('titleInput');
const typeSelect = document.getElementById('typeSelect');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const roomInput = document.getElementById('roomInput');
const roomBtn = document.getElementById('roomBtn');
const roomLabel = document.getElementById('roomLabel');

const RATING_LABELS = ['Sem avaliação', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

// ── LOAD ──────────────────────────────────────────────
async function loadItems() {
  try {
    items = await mediaApi.getAll();
    renderGrid();
    loadStats();
  } catch (e) {
    grid.innerHTML = `<div class="empty">
      <div class="empty-icon">⚠️</div>
      <h3>Não foi possível carregar sua lista</h3>
      <p>Os dados ficam salvos no navegador e a aplicação funciona diretamente no Vercel.</p>
    </div>`;
  }
}

async function loadStats() {
  try {
    const stats = await mediaApi.stats();
    document.getElementById('totalCount').textContent = stats.total;
    document.getElementById('movieCount').textContent = stats.movies;
    document.getElementById('seriesCount').textContent = stats.series;
    document.getElementById('avgRating').textContent = stats.avgRating ?? '—';
  } catch {}
}

// ── ADD ───────────────────────────────────────────────
async function addItem() {
  const title = titleInput.value.trim();
  const type = typeSelect.value;
  if (!title) { titleInput.focus(); return; }

  try {
    await mediaApi.create(title, type);
    titleInput.value = '';
    showToast(`✅ ${title} adicionado!`);
    await loadItems();
  } catch (e) {
    showToast(`⚠️ ${e.message}`);
  }
}

document.getElementById('addBtn').addEventListener('click', addItem);
titleInput.addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });

// ── DELETE ────────────────────────────────────────────
async function deleteItem(id) {
  try {
    await mediaApi.remove(id);
    await loadItems();
  } catch (e) {
    showToast(`⚠️ ${e.message}`);
  }
}

// ── RATE / NOTES ──────────────────────────────────────
async function setRating(id, rating) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  try {
    await mediaApi.update(id, rating, item.notes);
    await loadItems();
  } catch (e) {
    showToast(`⚠️ ${e.message}`);
  }
}

let notesTimers = {};
function updateNotes(id, val) {
  clearTimeout(notesTimers[id]);
  notesTimers[id] = setTimeout(async () => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      await mediaApi.update(id, item.rating, val);
      item.notes = val; // keep local state in sync without full reload
    } catch (e) {
      showToast(`⚠️ ${e.message}`);
    }
  }, 600);
}

// ── FILTERS ───────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderGrid();
  });
});
searchInput.addEventListener('input', renderGrid);
sortSelect.addEventListener('change', renderGrid);

function getFiltered() {
  const q = searchInput.value.toLowerCase();
  const sort = sortSelect.value;
  let list = [...items];

  if (currentFilter === 'filme') list = list.filter(i => i.type === 'filme');
  else if (currentFilter === 'série') list = list.filter(i => i.type === 'série');
  else if (currentFilter === '5') list = list.filter(i => i.rating === 5);

  if (q) list = list.filter(i =>
    i.title.toLowerCase().includes(q) || i.notes.toLowerCase().includes(q)
  );

  if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  else if (sort === 'name') list.sort((a, b) => a.title.localeCompare(b.title, 'pt'));
  else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return list;
}

// ── RENDER ────────────────────────────────────────────
function renderGrid() {
  const list = getFiltered();

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty">
      <div class="empty-icon">🎬</div>
      <h3>${items.length === 0 ? 'Sua lista está vazia' : 'Nenhum resultado'}</h3>
      <p>${items.length === 0 ? 'Adicione filmes e séries que você assistiu ou quer assistir.' : 'Tente outro filtro ou busca.'}</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(item => {
    const typeClass = item.type === 'filme' ? 'movie' : 'series';
    const typeEmoji = item.type === 'filme' ? '🎬' : '📺';
    const stars = [1,2,3,4,5].map(n => `
      <span class="star ${n <= item.rating ? 'lit' : ''}" data-id="${item.id}" data-n="${n}">★</span>
    `).join('');
    const date = new Date(item.createdAt).toLocaleDateString('pt-BR');

    return `
      <div class="card" id="card-${item.id}">
        <div class="card-header">
          <div class="card-title">${escHtml(item.title)}</div>
          <span class="pill ${typeClass}">${typeEmoji} ${item.type}</span>
        </div>
        <div class="stars" id="stars-${item.id}">${stars}</div>
        <span class="rating-label">${RATING_LABELS[item.rating]}</span>
        <textarea class="notes-input" placeholder="Anote suas impressões…" data-id="${item.id}">${escHtml(item.notes)}</textarea>
        <div class="card-footer">
          <span class="card-date">${date}</span>
          <div style="display:flex;gap:6px">
            <button class="btn-ai" data-id="${item.id}">✦ IA</button>
            <button class="btn-delete" data-id="${item.id}">Remover</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  attachCardEvents();
}

function attachCardEvents() {
  grid.querySelectorAll('.star').forEach(star => {
    const id = Number(star.dataset.id);
    const n = Number(star.dataset.n);
    star.addEventListener('click', () => setRating(id, n));
    star.addEventListener('mouseover', () => hoverStars(id, n));
    star.addEventListener('mouseleave', () => unhoverStars(id));
  });

  grid.querySelectorAll('.notes-input').forEach(el => {
    el.addEventListener('input', () => updateNotes(Number(el.dataset.id), el.value));
  });

  grid.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(Number(btn.dataset.id)));
  });

  grid.querySelectorAll('.btn-ai').forEach(btn => {
    btn.addEventListener('click', () => getAINote(Number(btn.dataset.id), btn));
  });
}

function hoverStars(id, n) {
  document.querySelectorAll(`#stars-${id} .star`).forEach(s => {
    s.classList.toggle('lit', Number(s.dataset.n) <= n);
  });
}
function unhoverStars(id) {
  const item = items.find(i => i.id === id);
  const r = item ? item.rating : 0;
  document.querySelectorAll(`#stars-${id} .star`).forEach(s => {
    s.classList.toggle('lit', Number(s.dataset.n) <= r);
  });
}

function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── AI ANALYSIS (calls C# backend, which calls Anthropic) ──
async function getAINote(id, btn) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  btn.classList.add('loading');
  btn.textContent = '… gerando';

  modalTitle.textContent = item.title;
  modalBody.innerHTML = `<div class="modal-loading"><div class="spinner"></div> Consultando a IA…</div>`;
  modal.style.display = 'flex';

  try {
    const { analysis } = await mediaApi.analyze(id);
    modalBody.textContent = analysis;
  } catch (e) {
    modalBody.textContent = `⚠️ ${e.message}`;
  }

  btn.classList.remove('loading');
  btn.textContent = '✦ IA';
}

document.getElementById('modalClose').addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

// ── TOAST ─────────────────────────────────────────────
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

async function applyRoom() {
  const room = roomInput.value.trim().toLowerCase() || 'default';
  roomInput.value = room;
  await mediaApi.setRoom(room);
  roomLabel.textContent = `Sala: ${room}`;
  await loadItems();
}

roomBtn.addEventListener('click', applyRoom);
roomInput.addEventListener('keydown', e => { if (e.key === 'Enter') applyRoom(); });

(async function init() {
  const room = await mediaApi.getRoom();
  roomInput.value = room;
  roomLabel.textContent = `Sala: ${room}`;
  await loadItems();
})();
