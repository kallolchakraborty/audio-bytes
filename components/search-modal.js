import { $, html, debounce, getYouTubeThumbnail } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, show, hide, trapFocus } from '../js/ui.js';

let _searchOpen = false;
let _selectedIndex = -1;
let _lastFocus = null;
let _cleanupTrap = null;

export function initSearchModal() {
  const container = $('#search-modal');
  if (!container) return;

  render(container, html`
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4" id="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
      <div class="w-full max-w-2xl bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-down">
        <div class="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <span class="material-symbols-outlined text-slate-400 text-lg">search</span>
          <input type="text" id="search-input"
                 class="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                 placeholder="Search songs, artists, albums, playlists, genres..."
                 autocomplete="off"
                 aria-label="Search query">
          <button id="search-close-btn" class="text-xs text-slate-500 border border-white/10 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors" aria-label="Close search">ESC</button>
        </div>
        <div id="search-results" class="max-h-[60vh] overflow-y-auto p-2">
          <div class="flex items-center justify-center py-12 text-slate-500">
            <span class="material-symbols-outlined text-3xl mr-2">search</span>
            <span class="text-sm">Type to search songs, artists, albums, playlists or genres...</span>
          </div>
        </div>
        <div class="px-4 py-2 border-t border-white/5 flex items-center gap-4 text-[11px] text-slate-500">
          <span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-white/5 rounded text-[10px]">↑</kbd><kbd class="px-1 py-0.5 bg-white/5 rounded text-[10px]">↓</kbd> navigate</span>
          <span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-white/5 rounded text-[10px]">↵</kbd> play</span>
          <span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-white/5 rounded text-[10px]">⌘K</kbd> toggle</span>
          <span class="flex items-center gap-1"><kbd class="px-1 py-0.5 bg-white/5 rounded text-[10px]">esc</kbd> close</span>
        </div>
      </div>
    </div>
  `);

  const overlay = $('#search-overlay');
  const input = $('#search-input');
  const results = $('#search-results');

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('.search-result-item')) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _searchOpen) {
      closeSearch();
    }
  });

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); navigateResults(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); navigateResults(-1); }
      if (e.key === 'Enter') { e.preventDefault(); selectResult(); }
    });

    input.addEventListener('input', debounce((e) => {
      const query = e.target.value.trim();
      if (query.length < 1) {
        render(results, html`
          <div class="flex items-center justify-center py-12 text-slate-500">
            <span class="material-symbols-outlined text-3xl mr-2">search</span>
            <span class="text-sm">Type to search songs, artists, albums, playlists or genres...</span>
          </div>
        `);
        return;
      }
      performSearch(query, results);
    }, 200));
  }

  const closeBtn = $('#search-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
}

export function openSearch() {
  _searchOpen = true;
  _selectedIndex = -1;
  _lastFocus = document.activeElement;
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.setAttribute('aria-hidden', 'true'));
  const modal = $('#search-modal');
  const input = $('#search-input');
  if (modal) {
    show(modal);
    _cleanupTrap = trapFocus(modal);
  }
  setTimeout(() => input?.focus(), 100);
}

export function isOpen() {
  return _searchOpen;
}

export function closeSearch() {
  _searchOpen = false;
  _selectedIndex = -1;
  if (_cleanupTrap) { _cleanupTrap(); _cleanupTrap = null; }
  const modal = $('#search-modal');
  if (modal) hide(modal);
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.removeAttribute('aria-hidden'));
  if (_lastFocus) { _lastFocus.focus(); _lastFocus = null; }
  if (window.location.hash === '#/search') {
    import('../js/router.js').then(r => r.router.navigate('/'));
  }
}

function performSearch(query, resultsContainer) {
  if (!resultsContainer || !query) return;

  const allSongs = store.getAllSongs();
  const playlists = store.get('playlists');
  const q = query.toLowerCase();

  const matchingPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q)
  );

  const matchingSongs = allSongs.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    (s.album && s.album.toLowerCase().includes(q)) ||
    (s.genre && s.genre.toLowerCase().includes(q)) ||
    (s.year && String(s.year).includes(q))
  ).slice(0, 20);

  _selectedIndex = matchingPlaylists.length > 0 ? -1 : 0;

  if (!matchingSongs.length && !matchingPlaylists.length) {
    render(resultsContainer, html`
      <div class="flex flex-col items-center justify-center py-12 text-slate-500">
        <span class="material-symbols-outlined text-3xl mb-3">search_off</span>
        <p class="text-sm">No results for "<span class="text-slate-300">${query}</span>"</p>
        <p class="text-xs text-slate-600 mt-1">Try searching by song title, artist, album, or genre</p>
      </div>
    `);
    return;
  }

  const playlistItems = matchingPlaylists.map(p => `
    <a href="#/playlist/${p.id}" class="search-result-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" data-type="playlist" data-id="${p.id}">
      <div class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-elevated">
        <img src="${p.cover}" alt="${p.name || ''}" class="w-full h-full object-cover" onerror="this.src='assets/images/fallback-album.svg'">
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-white truncate">${highlight(p.name, query)}</p>
        <p class="text-xs text-slate-400 truncate">Playlist · ${p.songs.length} songs</p>
      </div>
      <span class="material-symbols-outlined text-slate-500 text-sm">chevron_right</span>
    </a>
  `).join('');

  const songItems = matchingSongs.map((s, i) => `
    <a href="#/playlist/${s.playlistId}" class="search-result-item flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" data-type="song" data-index="${i}" data-song-id="${s.id}" data-playlist-id="${s.playlistId}">
      <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-surface-elevated">
        <img src="${getYouTubeThumbnail(s.youtube_id, 'default')}" alt="${s.title || ''}" class="w-full h-full object-cover" loading="lazy" onerror="this.src='assets/images/fallback-album.svg'">
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-white truncate">${highlight(s.title, query)}</p>
        <p class="text-xs text-slate-400 truncate">${highlight(s.artist, query)} ${s.year ? '· ' + s.year : ''} ${s.genre ? '· <span class="text-brand-400/70">' + highlight(s.genre, query) + '</span>' : ''}</p>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button class="btn-icon w-7 h-7 text-xs bg-white/5 hover:bg-brand-500/20 rounded-full flex items-center justify-center search-play-btn" data-song-id="${s.id}" data-playlist-id="${s.playlistId}" data-index="${i}" title="Play now" aria-label="Play ${s.title}">
          <span class="material-symbols-outlined text-sm">play_arrow</span>
        </button>
        <span class="text-xs text-slate-500 tabular-nums">${s.duration}</span>
      </div>
    </a>
  `).join('');

  const totalResults = matchingPlaylists.length + matchingSongs.length;

  render(resultsContainer, html`
    <div class="flex items-center justify-between px-3 py-2">
      <span class="text-xs text-slate-500">${totalResults} result${totalResults !== 1 ? 's' : ''}</span>
    </div>
    ${playlistItems ? `<div class="px-3 py-1 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Playlists</div>${playlistItems}` : ''}
    ${songItems ? `<div class="px-3 py-1 text-[10px] text-slate-600 uppercase tracking-wider font-semibold">Songs</div>${songItems}` : ''}
  `);

  resultsContainer.querySelectorAll('.search-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const songId = btn.dataset.songId;
      const playlistId = btn.dataset.playlistId;
      const playlist = store.getPlaylist(playlistId);
      if (!playlist) return;
      const song = playlist.songs.find(s => s.id === songId);
      if (song) {
        store.playSong(song, playlistId, playlist.name, playlist.cover);
        closeSearch();
      }
    });
  });

  const firstItem = $('.search-result-item', resultsContainer);
  if (firstItem) {
    _selectedIndex = 0;
    highlightItem(firstItem);
  }
}

function navigateResults(dir) {
  const items = document.querySelectorAll('#search-results .search-result-item');
  if (!items.length) return;
  if (_selectedIndex >= 0 && items[_selectedIndex]) {
    items[_selectedIndex].classList.remove('bg-white/5', 'ring-1', 'ring-brand-500/30');
  }
  _selectedIndex = Math.max(0, Math.min(items.length - 1, (_selectedIndex + dir)));
  if (items[_selectedIndex]) {
    highlightItem(items[_selectedIndex]);
    items[_selectedIndex].scrollIntoView({ block: 'nearest' });
  }
}

function selectResult() {
  const items = document.querySelectorAll('#search-results .search-result-item');
  if (_selectedIndex >= 0 && items[_selectedIndex]) {
    const playBtn = items[_selectedIndex].querySelector('.search-play-btn');
    if (playBtn) {
      playBtn.click();
    } else {
      items[_selectedIndex].click();
    }
  }
}

function highlightItem(el) {
  el.classList.add('bg-white/5', 'ring-1', 'ring-brand-500/30');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function highlight(text, query) {
  if (!query) return escapeHTML(text);
  const safe = escapeHTML(text);
  const lower = safe.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return safe;
  return safe.slice(0, idx) + '<span class="search-highlight">' + safe.slice(idx, idx + query.length) + '</span>' + safe.slice(idx + query.length);
}
