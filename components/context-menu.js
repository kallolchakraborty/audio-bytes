import { $, html } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, hide } from '../js/ui.js';

export function showContextMenu(e, song, playlistId, playlistName, playlistCover) {
  const container = $('#context-menu');
  if (!container) return;

  const menuWidth = 200;
  const menuHeight = 340;
  const x = Math.min(e.clientX, window.innerWidth - menuWidth);
  const y = Math.min(e.clientY, window.innerHeight - menuHeight);

  renderMainMenu();

  container.classList.remove('hidden');

  let submenuActive = false;

  const handleClick = (e) => {
    const target = e.target.closest('[class*="context-"]');
    if (!target) { closeMenu(); return; }

    if (target.classList.contains('context-play')) {
      store.playSong(song, playlistId, playlistName, playlistCover);
    } else if (target.classList.contains('context-play-next')) {
      const queue = [...store.get('queue')];
      queue.splice((store.get('queueIndex') || 0) + 1, 0, { ...song, playlistId, playlistName, playlistCover });
      store.setState('queue', queue);
      import('./toast.js').then(m => m.showToast('Will play next'));
    } else if (target.classList.contains('context-add-queue')) {
      const queue = [...store.get('queue')];
      queue.push({ ...song, playlistId, playlistName, playlistCover });
      store.setState('queue', queue);
      import('./toast.js').then(m => m.showToast('Added to queue'));
    } else if (target.classList.contains('context-fav')) {
      store.toggleFavorite(song.id);
    } else if (target.classList.contains('context-dislike')) {
      store.toggleDislike(song.id);
    } else if (target.classList.contains('context-add-to-pl')) {
      e.stopPropagation();
      renderPlaylistPicker();
      return;
    } else if (target.classList.contains('context-pl-back')) {
      e.stopPropagation();
      renderMainMenu();
      return;
    } else if (target.classList.contains('context-pl-item')) {
      const plId = target.dataset.plId;
      store.addSongToPlaylist(plId, { ...song, playlistId, playlistName, playlistCover });
      import('./toast.js').then(m => m.showToast(`Added to ${target.dataset.plName}`));
    } else if (target.classList.contains('context-goto-playlist')) {
      import('../js/router.js').then(r => r.router.navigate(`/playlist/${playlistId}`));
    } else if (target.classList.contains('context-radio')) {
      import('./radio.js').then(m => m.startRadioSong(song.id, playlistId));
    } else if (target.classList.contains('context-share')) {
      shareSong(song, playlistId);
    }
    if (!submenuActive) closeMenu();
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') closeMenu();
  };

  document.addEventListener('click', handleClick, { once: true });
  document.addEventListener('keydown', handleKey, { once: true });

  function closeMenu() {
    submenuActive = false;
    hide(container);
    container.innerHTML = '';
  }

  function renderMainMenu() {
    submenuActive = false;
    render(container, html`
      <div class="bg-surface-elevated border border-white/10 rounded-xl shadow-2xl py-1 min-w-[180px] animate-scale-in" style="position:absolute;left:${x}px;top:${y}px">
        <button role="menuitem" class="context-menu-item context-play" data-song-id="${song.id}">
          <span class="material-symbols-outlined text-sm">play_arrow</span>
          Play
        </button>
        <button role="menuitem" class="context-menu-item context-play-next">
          <span class="material-symbols-outlined text-sm">playlist_add</span>
          Play Next
        </button>
        <button role="menuitem" class="context-menu-item context-add-queue">
          <span class="material-symbols-outlined text-sm">queue</span>
          Add to Queue
        </button>
        <div class="h-px bg-white/5 my-1"></div>
        <button role="menuitem" class="context-menu-item context-fav">
          <span class="material-symbols-outlined text-sm">${store.getLikedIds().includes(song.id) ? 'favorite' : 'favorite_border'}</span>
          ${store.getLikedIds().includes(song.id) ? 'Remove from Favorites' : 'Add to Favorites'}
        </button>
        <button role="menuitem" class="context-menu-item context-dislike">
          <span class="material-symbols-outlined text-sm">${store.getDislikedIds().includes(song.id) ? 'thumb_down' : 'thumb_down_off_alt'}</span>
          ${store.getDislikedIds().includes(song.id) ? 'Remove Dislike' : 'Dislike'}
        </button>
        <button role="menuitem" class="context-menu-item context-add-to-pl">
          <span class="material-symbols-outlined text-sm">playlist_add</span>
          Add to Playlist
          <span class="material-symbols-outlined text-sm ml-auto">chevron_right</span>
        </button>
        <div class="h-px bg-white/5 my-1"></div>
        <button role="menuitem" class="context-menu-item context-radio">
          <span class="material-symbols-outlined text-sm">radio</span>
          Start Radio
        </button>
        <button role="menuitem" class="context-menu-item context-goto-playlist">
          <span class="material-symbols-outlined text-sm">playlist_play</span>
          Go to Playlist
        </button>
        <button role="menuitem" class="context-menu-item context-share">
          <span class="material-symbols-outlined text-sm">share</span>
          Share
        </button>
      </div>
    `);
  }

  function renderPlaylistPicker() {
    submenuActive = true;
    const myPlaylists = store.get('myPlaylists') || [];
    render(container, html`
      <div class="bg-surface-elevated border border-white/10 rounded-xl shadow-2xl py-1 min-w-[180px] animate-scale-in" style="position:absolute;left:${x}px;top:${y}px">
        <button role="menuitem" class="context-menu-item context-pl-back text-slate-400">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <div class="h-px bg-white/5 my-1"></div>
        ${myPlaylists.length === 0 ? '<p class="px-3 py-2 text-xs text-slate-500">No playlists yet. Create one from the sidebar.</p>' : ''}
        ${myPlaylists.map(pl => `
          <button role="menuitem" class="context-menu-item context-pl-item" data-pl-id="${pl.id}" data-pl-name="${pl.name}">
            <span class="material-symbols-outlined text-sm">playlist_play</span>
            ${pl.name}
          </button>
        `).join('')}
      </div>
    `);
  }
}

function shareSong(song, playlistId) {
  const url = `${window.location.origin}${window.location.pathname}#/playlist/${playlistId}`;
  const title = `${song.title} by ${song.artist}`;
  if (navigator.share) {
    navigator.share({ title, text: title, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      import('./toast.js').then(m => m.showToast('Link copied to clipboard'));
    }).catch(() => {});
  }
}
