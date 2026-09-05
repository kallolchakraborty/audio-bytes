import { $, html, getYouTubeThumbnail, debounce } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, errorState, setPageTitle, staggerOnView } from '../js/ui.js';

let _clickHandler = null;

export function renderPlaylist(playlistId) {
  const container = $('#page-view');
  if (!container) return;

  const playlist = store.getPlaylist(playlistId);
  if (!playlist) {
    errorState(container, 'Playlist not found.', () => renderPlaylist(playlistId));
    setPageTitle('Not Found');
    return;
  }

  setPageTitle(playlist.name);

  const firstSong = playlist.songs[0];
  const cover = firstSong ? getYouTubeThumbnail(firstSong.youtube_id, 'hqdefault') : 'assets/images/fallback-album.svg';
  const totalDuration = playlist.songs.reduce((acc, s) => acc + parseDuration(s.duration), 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;

  const viewMode = store.get('viewMode');
  const myPlaylists = store.get('myPlaylists') || [];
  const isUserPlaylist = myPlaylists.some(p => p.id === playlistId);

  render(container, html`
    <div class="playlist-header-gradient relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-b from-brand-500/10 to-transparent pointer-events-none"></div>
      <div class="grid-bg absolute inset-0 pointer-events-none"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-6 lg:pb-0">
        <div class="mb-4">
          <button class="btn-ghost text-xs back-to-previous" aria-label="Go back">
            <span class="material-symbols-outlined text-sm">arrow_back</span>
            Back
          </button>
        </div>
        <div class="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
          <div class="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-24">
            <div class="w-36 h-36 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-2xl overflow-hidden shadow-2xl shadow-brand-500/10 cover-art-glow mx-auto lg:mx-0">
              <img src="${cover}" alt="${playlist.name}"
                   class="w-full h-full object-cover"
                   onerror="this.src='assets/images/fallback-album.svg'">
            </div>
            <div class="mt-4 lg:mt-5 text-center lg:text-left">
              <p class="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">Playlist</p>
              <h1 class="text-3xl sm:text-4xl font-bold text-white mb-2">${playlist.name}</h1>
              <p class="text-sm text-slate-400 mb-4">${playlist.description || ''}</p>
              <div class="flex items-center justify-center lg:justify-start gap-3 text-sm text-slate-400 mb-5">
                <span class="text-white font-medium">${playlist.songs.length} songs</span>
                <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                <span>${minutes} min ${seconds > 0 ? `${seconds} sec` : ''}</span>
              </div>
              <div class="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                <button class="btn-primary playlist-play-all" data-playlist-id="${playlist.id}">
                  <span class="material-symbols-outlined text-sm">play_arrow</span>
                  Play All
                </button>
                <button class="btn-ghost playlist-shuffle-all" data-playlist-id="${playlist.id}">
                  <span class="material-symbols-outlined text-sm">shuffle</span>
                  Shuffle
                </button>
                <button class="btn-ghost playlist-radio-btn" data-playlist-id="${playlist.id}">
                  <span class="material-symbols-outlined text-sm">radio</span>
                  Radio
                </button>
                <button class="btn-icon playlist-share-btn" aria-label="Share playlist" data-playlist-id="${playlist.id}">
                  <span class="material-symbols-outlined text-sm">share</span>
                </button>
                ${isUserPlaylist ? `
                  <button class="btn-icon playlist-rename-btn text-slate-400 hover:text-white" aria-label="Rename playlist" data-playlist-id="${playlist.id}">
                    <span class="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button class="btn-icon playlist-delete-btn text-slate-400 hover:text-red-400" aria-label="Delete playlist" data-playlist-id="${playlist.id}">
                    <span class="material-symbols-outlined text-sm">delete</span>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>

          <div class="flex-1 min-w-0 w-full">
            <div class="flex items-center gap-3 mb-4">
              <div class="relative flex-1 max-w-md">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">search</span>
                <input type="text" class="playlist-search w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-colors" placeholder="Search in playlist..." aria-label="Search in playlist">
              </div>
              <button class="btn-ghost text-xs sort-btn" data-sort="default">
                <span class="material-symbols-outlined text-sm">sort</span>
                Sort
              </button>
              <button class="btn-icon view-toggle hidden sm:flex" aria-label="${viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}" data-mode="${viewMode === 'grid' ? 'list' : 'grid'}">
                <span class="material-symbols-outlined">${viewMode === 'grid' ? 'view_list' : 'grid_view'}</span>
              </button>
            </div>

            <div id="songs-container" class="${viewMode === 'grid' ? 'song-grid' : 'flex flex-col'}">
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  const songsContainer = $('#songs-container');
  if (songsContainer) {
    renderSongs(songsContainer, playlist.songs, playlist.id, playlist.name, playlist.cover, viewMode);
  }

  if (_clickHandler) container.removeEventListener('click', _clickHandler);
  _clickHandler = (e) => {
    const backBtn = e.target.closest('.back-to-previous');
    if (backBtn) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        import('../js/router.js').then(r => r.router.navigate('/explore'));
      }
      return;
    }

    const playAll = e.target.closest('.playlist-play-all');
    if (playAll) {
      store.playPlaylist(playAll.dataset.playlistId, 0);
      return;
    }

    const shuffleAll = e.target.closest('.playlist-shuffle-all');
    if (shuffleAll) {
      store.setState('shuffle', true);
      store.playPlaylist(shuffleAll.dataset.playlistId, 0);
      return;
    }

    const radioBtn = e.target.closest('.playlist-radio-btn');
    if (radioBtn) {
      import('./radio.js').then(m => m.startRadioPlaylist(radioBtn.dataset.playlistId));
      return;
    }

    const shareBtn = e.target.closest('.playlist-share-btn');
    if (shareBtn) {
      const id = shareBtn.dataset.playlistId;
      const url = `${window.location.origin}${window.location.pathname}#/playlist/${id}`;
      if (navigator.share) {
        navigator.share({ url, title: playlist.name }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => {
          import('./toast.js').then(m => m.showToast('Link copied to clipboard'));
        }).catch(() => {});
      }
      return;
    }

    const renameBtn = e.target.closest('.playlist-rename-btn');
    if (renameBtn) {
      showRenameModal(playlist.id, playlist.name);
      return;
    }

    const deleteBtn = e.target.closest('.playlist-delete-btn');
    if (deleteBtn) {
      showDeleteModal(playlist.id, playlist.name);
      return;
    }

    const viewToggle = e.target.closest('.view-toggle');
    if (viewToggle) {
      const newMode = viewToggle.dataset.mode;
      store.setState('viewMode', newMode);
      container.dataset.scrollPos = window.scrollY;
      renderPlaylist(playlistId);
      return;
    }

    const sortBtn = e.target.closest('.sort-btn');
    if (sortBtn) {
      container.dataset.scrollPos = window.scrollY;
      sortSongs(playlist, songsContainer, viewMode);
      return;
    }
  };
  container.addEventListener('click', _clickHandler);

  const searchInput = $('.playlist-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      const query = e.target.value.toLowerCase();
      const filtered = playlist.songs.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query) ||
        (s.album && s.album.toLowerCase().includes(query)) ||
        (s.genre && s.genre.toLowerCase().includes(query))
      );
      if (songsContainer) {
        renderSongs(songsContainer, filtered, playlist.id, playlist.name, playlist.cover, viewMode);
      }
    }, 150));
  }

  const savedScroll = parseInt(container.dataset.scrollPos);
  if (savedScroll > 0) {
    requestAnimationFrame(() => { window.scrollTo(0, savedScroll); delete container.dataset.scrollPos; });
  }

  requestAnimationFrame(() => staggerOnView(container, '.animate-in', 60));
}

function renderSongs(container, songs, playlistId, playlistName, playlistCover, viewMode) {
  if (!songs.length) {
    render(container, html`
      <div class="empty-state py-16">
        <span class="material-symbols-outlined text-4xl text-slate-600 mb-3">search_off</span>
        <p class="text-slate-400">No songs match your search.</p>
      </div>
    `);
    return;
  }

  if (viewMode === 'grid') {
    container.className = 'song-grid';
    import('./song-card.js').then(m => {
      m.renderSongCards(container, songs, playlistId, playlistName, playlistCover);
      staggerOnView(container, '.animate-in', 60);
    });
  } else {
    container.className = 'flex flex-col';
    import('./song-card.js').then(m => {
      m.renderSongRows(container, songs, playlistId, playlistName, playlistCover);
      staggerOnView(container, '.animate-in', 60);
    });
  }
}

function sortSongs(playlist, container, viewMode) {
  const sorts = ['default', 'title', 'artist', 'year', 'duration'];
  const current = store.get('sortBy') || 'default';
  const nextIdx = (sorts.indexOf(current) + 1) % sorts.length;
  const next = sorts[nextIdx];
  store.setState('sortBy', next);

  const stripArticle = (s) => s.replace(/^(The|A|An)\s+/i, '');
  let sorted = [...playlist.songs];
  if (next === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
  else if (next === 'artist') sorted.sort((a, b) => stripArticle(a.artist).localeCompare(stripArticle(b.artist)));
  else if (next === 'year') sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
  else if (next === 'duration') sorted.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration));
  else sorted = playlist.songs;

  import('./toast.js').then(m => m.showToast(`Sorted by ${next}`));
  renderSongs(container, sorted, playlist.id, playlist.name, playlist.cover, viewMode);
}

function parseDuration(d) {
  if (!d) return 0;
  const parts = d.split(':');
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return 0;
}

function showRenameModal(playlistId, currentName) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/60';
  overlay.innerHTML = `
    <div class="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" role="dialog" aria-modal="true" aria-label="Rename playlist">
      <h2 class="text-lg font-bold text-white mb-4">Rename Playlist</h2>
      <input type="text" class="rename-pl-input w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand" value="${currentName}" maxlength="60" autofocus>
      <div class="flex justify-end gap-2 mt-4">
        <button class="rename-pl-cancel px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
        <button class="rename-pl-submit px-4 py-2 rounded-lg text-sm bg-brand text-white hover:bg-brand-hover transition-colors">Rename</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('.rename-pl-input');
  const submit = overlay.querySelector('.rename-pl-submit');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit.click();
    if (e.key === 'Escape') overlay.remove();
  });

  submit.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) return;
    store.renamePlaylist(playlistId, name);
    overlay.remove();
    renderPlaylist(playlistId);
  });

  overlay.querySelector('.rename-pl-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  setTimeout(() => input.select(), 50);
}

function showDeleteModal(playlistId, name) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/60';
  overlay.innerHTML = `
    <div class="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" role="dialog" aria-modal="true" aria-label="Delete playlist">
      <h2 class="text-lg font-bold text-white mb-2">Delete Playlist</h2>
      <p class="text-sm text-slate-400 mb-4">Are you sure you want to delete <strong class="text-white">${name}</strong>? This cannot be undone.</p>
      <div class="flex justify-end gap-2">
        <button class="delete-pl-cancel px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
        <button class="delete-pl-confirm px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.delete-pl-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('.delete-pl-confirm').addEventListener('click', () => {
    store.deletePlaylist(playlistId);
    overlay.remove();
    import('../js/router.js').then(r => r.router.navigate('/library'));
  });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}
