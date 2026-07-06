import { $, getYouTubeThumbnail } from '../js/utils.js';
import { store } from '../js/store.js';
import { render } from '../js/ui.js';

const TABS = [
  { id: 'liked', label: 'Liked Songs', icon: 'favorite' },
  { id: 'recent', label: 'Recently Played', icon: 'schedule' },
  { id: 'history', label: 'History', icon: 'history' }
];

let currentTab = 'liked';

export function renderLibrary() {
  const container = $('#page-view');
  if (!container) return;
  currentTab = 'liked';
  render(container, layoutView());
  renderTab(currentTab);
  bindLibraryEvents();
}

function layoutView() {
  return `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="flex items-center gap-3 mb-6">
        <span class="material-symbols-outlined text-2xl text-slate-400">library_music</span>
        <h1 class="text-2xl font-bold text-white">Library</h1>
      </div>

      <div class="flex gap-1 mb-6 bg-white/5 rounded-xl p-1" id="lib-tabs" role="tablist">
        ${TABS.map((t, i) => `
          <button class="lib-tab flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${i === 0 ? 'bg-brand text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}
          " data-tab="${t.id}" role="tab" aria-selected="${i === 0}">
            <span class="material-symbols-outlined text-sm">${t.icon}</span>
            ${t.label}
          </button>
        `).join('')}
      </div>

      <div id="lib-content"></div>
    </div>
  `;
}

function renderTab(tabId) {
  const content = $('#lib-content');
  if (!content) return;

  const favIds = store.get('favorites') || [];
  const recent = store.get('recentlyPlayed') || [];

  let items = [];
  let emptyMsg = '';

  switch (tabId) {
    case 'liked':
      items = tabId === 'liked' ? resolveFavorites(favIds) : [];
      if (!items.length) emptyMsg = 'No liked songs yet. Click the heart icon on any song to add it.';
      break;
    case 'recent':
      items = recent.slice(0, 20);
      if (!items.length) emptyMsg = 'No recently played songs.';
      break;
    case 'history':
      items = recent;
      if (!items.length) emptyMsg = 'No listening history yet.';
      break;
  }

  if (items.length) {
    content.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs text-slate-500">${items.length} song${items.length !== 1 ? 's' : ''}</span>
        ${tabId === 'liked' ? '<button class="lib-play-all text-xs text-brand hover:text-brand-hover transition-colors flex items-center gap-1"><span class="material-symbols-outlined text-sm">play_arrow</span> Play All</button>' : ''}
      </div>
      <div class="space-y-1">
        ${items.map((song, i) => songRow(song, i, tabId)).join('')}
      </div>
    `;
  } else {
    content.innerHTML = `
      <div class="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
        <span class="material-symbols-outlined text-4xl">${TABS.find(t => t.id === tabId)?.icon || 'music_note'}</span>
        <p class="text-sm">${emptyMsg}</p>
      </div>
    `;
  }
}

function resolveFavorites(favIds) {
  const all = store.getAllSongs();
  return all.filter(s => favIds.includes(s.id));
}

function songRow(song, index, tabId) {
  const thumb = song.youtube_id ? getYouTubeThumbnail(song.youtube_id, 'default') : 'assets/images/fallback-album.svg';
  const isFav = (store.get('favorites') || []).includes(song.id);
  return `
    <div class="lib-row flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group" data-song-idx="${index}" data-tab="${tabId}">
      <img src="${thumb}" alt="" class="w-10 h-10 rounded object-cover flex-shrink-0" loading="lazy" onerror="this.src='assets/images/fallback-album.svg'">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white truncate">${song.title}</p>
        <p class="text-xs text-slate-400 truncate">${song.artist}${song.album ? ` · ${song.album}` : ''}</p>
      </div>
      <span class="text-xs text-slate-500 tabular-nums">${song.duration || ''}</span>
      <button class="lib-fav-btn btn-icon w-7 h-7 text-sm ${isFav ? 'text-red-400' : 'text-slate-500'} opacity-0 group-hover:opacity-100 transition-opacity" data-song-id="${song.id}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
        <span class="material-symbols-outlined text-sm">${isFav ? 'favorite' : 'favorite_border'}</span>
      </button>
    </div>
  `;
}

function bindLibraryEvents() {
  const container = $('#page-view');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const tab = e.target.closest('.lib-tab');
    if (tab) {
      currentTab = tab.dataset.tab;
      document.querySelectorAll('.lib-tab').forEach(t => {
        t.classList.remove('bg-brand', 'text-white', 'shadow-md');
        t.classList.add('text-slate-400', 'hover:text-white', 'hover:bg-white/5');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('bg-brand', 'text-white', 'shadow-md');
      tab.classList.remove('text-slate-400', 'hover:text-white', 'hover:bg-white/5');
      tab.setAttribute('aria-selected', 'true');
      renderTab(currentTab);
      return;
    }

    const row = e.target.closest('.lib-row');
    if (row && !e.target.closest('.lib-fav-btn')) {
      const idx = parseInt(row.dataset.songIdx);
      const tab = row.dataset.tab;
      const songs = getSongsForTab(tab);
      if (songs[idx]) {
        store.playSong(songs[idx], songs[idx].playlistId, songs[idx].playlistName, songs[idx].playlistCover);
      }
      return;
    }

    const favBtn = e.target.closest('.lib-fav-btn');
    if (favBtn) {
      const songId = favBtn.dataset.songId;
      const favs = store.get('favorites') || [];
      const idx = favs.indexOf(songId);
      if (idx > -1) { favs.splice(idx, 1); }
      else { favs.push(songId); }
      store.setState('favorites', favs);
      renderTab(currentTab);
      import('./toast.js').then(m => m.showToast(idx > -1 ? 'Removed from favorites' : 'Added to favorites'));
      return;
    }

    const playAll = e.target.closest('.lib-play-all');
    if (playAll) {
      const songs = resolveFavorites(store.get('favorites') || []);
      if (songs.length) store.playFromQueue(songs, 0);
      return;
    }
  });

  const unsub = store.on('change', ({ path }) => {
    if (['favorites', 'recentlyPlayed'].includes(path)) {
      const tab = document.querySelector('.lib-tab[aria-selected="true"]');
      if (tab) renderTab(tab.dataset.tab);
    }
    if (path === 'currentSong') { unsub(); }
  });
}

function getSongsForTab(tabId) {
  const favIds = store.get('favorites') || [];
  const recent = store.get('recentlyPlayed') || [];
  switch (tabId) {
    case 'liked': return resolveFavorites(favIds);
    case 'recent': return recent.slice(0, 20);
    case 'history': return recent;
    default: return [];
  }
}
