import { $, html, getYouTubeThumbnail, formatTime } from '../js/utils.js';
import { store } from '../js/store.js';
import { trapFocus } from '../js/ui.js';

let _open = false;
let _lastFocus = null;
let _cleanupTrap = null;
let _onKeyDown = null;
let _unsub = null;

export function toggleQueue() {
  if (_open) closeQueue();
  else openQueue();
}

export function openQueue() {
  if (_open) return;
  _open = true;
  _lastFocus = document.activeElement;
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.setAttribute('aria-hidden', 'true'));
  let panel = $('#queue-panel');
  if (panel) { panel.classList.remove('hidden'); }
  else { panel = createQueuePanel(); }
  renderQueueItems();
  setTimeout(() => panel.classList.add('open'), 10);
  _cleanupTrap = trapFocus(panel);
  _onKeyDown = (e) => { if (e.key === 'Escape') closeQueue(); };
  document.addEventListener('keydown', _onKeyDown);
  _unsub = store.on('change', ({ path }) => {
    if (['queue', 'queueIndex', 'currentSong'].includes(path)) renderQueueItems();
  });
}

export function closeQueue() {
  if (!_open) return;
  _open = false;
  const panel = $('#queue-panel');
  if (panel) {
    panel.classList.remove('open');
    setTimeout(() => panel.classList.add('hidden'), 300);
  }
  if (_onKeyDown) { document.removeEventListener('keydown', _onKeyDown); _onKeyDown = null; }
  if (_cleanupTrap) { _cleanupTrap(); _cleanupTrap = null; }
  if (_unsub) { _unsub(); _unsub = null; }
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.removeAttribute('aria-hidden'));
  if (_lastFocus) { _lastFocus.focus(); _lastFocus = null; }
}

function createQueuePanel() {
  const panel = document.createElement('div');
  panel.id = 'queue-panel';
  panel.className = 'fixed inset-0 z-50 pointer-events-none hidden';
  panel.innerHTML = `
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm queue-backdrop pointer-events-auto"></div>
    <div class="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-surface-elevated border-l border-white/10 shadow-2xl queue-drawer pointer-events-auto flex flex-col" role="dialog" aria-modal="true" aria-labelledby="queue-heading">
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 class="text-sm font-semibold text-white" id="queue-heading">Queue</h3>
        <button class="queue-close btn-icon w-7 h-7" aria-label="Close queue">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <div id="queue-items" class="flex-1 overflow-y-auto"></div>
      <div class="px-4 py-3 border-t border-white/5 flex gap-2">
        <button class="queue-clear text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">Clear queue</button>
        <button class="queue-save text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">Save as playlist</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  panel.addEventListener('click', (e) => {
    if (e.target.closest('.queue-backdrop') || e.target.closest('.queue-close')) closeQueue();
    if (e.target.closest('.queue-clear')) {
      store.setState('queue', []);
      store.setState('queueIndex', -1);
      import('./toast.js').then(m => m.showToast('Queue cleared'));
      renderQueueItems();
    }
    if (e.target.closest('.queue-save')) {
      saveQueueAsPlaylist();
    }
    if (e.target.closest('.queue-item') && !e.target.closest('.queue-remove-btn')) {
      const idx = parseInt(e.target.closest('.queue-item').dataset.index);
      if (!isNaN(idx)) {
        store.setState('queueIndex', idx);
        const queue = store.get('queue');
        if (queue[idx]) {
          store.setState('currentSong', queue[idx]);
          store.setState('currentTime', 0);
          store.setState('isPlaying', true);
        }
      }
    }
    if (e.target.closest('.queue-remove-btn')) {
      const idx = parseInt(e.target.closest('.queue-remove-btn').dataset.index);
      removeFromQueue(idx);
    }
  });

  const itemsContainer = $('#queue-items');
  if (itemsContainer) {
    let dragSrcIdx = null;
    itemsContainer.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.queue-item');
      if (!item) return;
      dragSrcIdx = parseInt(item.dataset.index);
      item.classList.add('opacity-40');
      e.dataTransfer.effectAllowed = 'move';
    });
    itemsContainer.addEventListener('dragend', (e) => {
      const item = e.target.closest('.queue-item');
      if (item) item.classList.remove('opacity-40');
      document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('border-t-brand-500', 'border-t-2', 'border-b-brand-500', 'border-b-2'));
      dragSrcIdx = null;
    });
    itemsContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      const item = e.target.closest('.queue-item');
      if (!item || dragSrcIdx === null) return;
      document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('border-t-brand-500', 'border-t-2', 'border-b-brand-500', 'border-b-2'));
      if (parseInt(item.dataset.index) === dragSrcIdx) return;
      const rect = item.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY > mid) item.classList.add('border-b-brand-500', 'border-b-2');
      else item.classList.add('border-t-brand-500', 'border-t-2');
    });
    itemsContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      const item = e.target.closest('.queue-item');
      if (!item || dragSrcIdx === null) return;
      const targetIdx = parseInt(item.dataset.index);
      if (dragSrcIdx !== targetIdx) {
        const queue = [...store.get('queue')];
        const qi = store.get('queueIndex');
        const [moved] = queue.splice(dragSrcIdx, 1);
        const insertAt = targetIdx > dragSrcIdx ? targetIdx - 1 : targetIdx;
        queue.splice(insertAt, 0, moved);
        if (dragSrcIdx === qi) store.setState('queueIndex', insertAt);
        else if (dragSrcIdx < qi && insertAt >= qi) store.setState('queueIndex', qi - 1);
        else if (dragSrcIdx > qi && insertAt <= qi) store.setState('queueIndex', qi + 1);
        store.setState('queue', queue);
      }
      document.querySelectorAll('.queue-item').forEach(el => el.classList.remove('border-t-brand-500', 'border-t-2', 'border-b-brand-500', 'border-b-2'));
      dragSrcIdx = null;
    });
  }

  return panel;
}

function renderQueueItems() {
  const container = $('#queue-items');
  if (!container) return;
  const queue = store.get('queue');
  const queueIndex = store.get('queueIndex');

  if (!queue.length) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-slate-500">
        <span class="material-symbols-outlined text-3xl mb-3">queue_music</span>
        <p class="text-sm">Queue is empty</p>
        <p class="text-xs text-slate-600 mt-1">Right-click a song to add it</p>
      </div>
    `;
    return;
  }

  let html = '';
  if (queueIndex >= 0 && queue[queueIndex]) {
    html += `<div class="px-4 py-2 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Now Playing</div>`;
    html += renderItem(queue[queueIndex], queueIndex, true);
  }
  const upcoming = queue.slice(queueIndex + 1);
  if (upcoming.length) {
    html += `<div class="px-4 py-2 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Up Next (${upcoming.length})</div>`;
    upcoming.forEach((s, i) => { html += renderItem(s, queueIndex + 1 + i, false); });
  }

  container.innerHTML = html;
}

function renderItem(song, index, isCurrent) {
  const thumb = song.youtube_id ? getYouTubeThumbnail(song.youtube_id, 'default') : 'assets/images/fallback-album.svg';
  return `
    <div class="queue-item flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors cursor-pointer ${isCurrent ? 'bg-brand-500/5' : ''}" data-index="${index}" draggable="true">
      <span class="text-xs text-slate-500 w-5 text-right flex-shrink-0">${isCurrent ? '<span class="flex items-end gap-[2px] h-3 justify-center">' + '<div class="w-[2px] rounded-full bg-brand-500 animate-pulse" style="height:8px"></div>'.repeat(3) + '</span>' : index + 1}</span>
      <img src="${thumb}" alt="" class="w-9 h-9 rounded object-cover flex-shrink-0" loading="lazy" onerror="this.src='assets/images/fallback-album.svg'">
      <div class="min-w-0 flex-1">
        <p class="text-xs font-medium text-white truncate">${song.title}</p>
        <p class="text-[11px] text-slate-400 truncate">${song.artist}</p>
      </div>
      <span class="text-[11px] text-slate-500 tabular-nums flex-shrink-0">${song.duration || ''}</span>
      <button class="queue-remove-btn btn-icon w-6 h-6 text-slate-500 hover:text-red-400 flex-shrink-0" data-index="${index}" aria-label="Remove from queue">
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    </div>
  `;
}

function removeFromQueue(index) {
  const queue = [...store.get('queue')];
  const qi = store.get('queueIndex');
  queue.splice(index, 1);
  store.setState('queue', queue);
  if (index < qi) store.setState('queueIndex', qi - 1);
  else if (index === qi) {
    if (queue[qi]) store.setState('currentSong', queue[qi]);
    else if (queue.length) {
      const newIdx = Math.min(qi, queue.length - 1);
      store.setState('queueIndex', newIdx);
      store.setState('currentSong', queue[newIdx]);
    }
  }
  renderQueueItems();
}

function saveQueueAsPlaylist() {
  const queue = store.get('queue');
  if (!queue.length) return;
  const playlists = store.get('playlists');
  const newId = 'queue-' + Date.now().toString(36);
  const newPlaylist = {
    id: newId,
    name: 'Saved Queue',
    description: `Saved from queue on ${new Date().toLocaleDateString()}`,
    songs: queue.map((s, i) => ({
      id: s.id || `${newId}-${i}`,
      title: s.title,
      artist: s.artist,
      album: s.album || '',
      year: s.year || '',
      duration: s.duration || '',
      youtube_id: s.youtube_id,
      genre: s.genre || ''
    }))
  };
  store.setState('playlists', [...playlists, newPlaylist]);
  import('./toast.js').then(m => m.showToast('Queue saved as playlist'));
}
