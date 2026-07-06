import { $, html } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, hide } from '../js/ui.js';

export function showContextMenu(e, song, playlistId, playlistName, playlistCover) {
  const container = $('#context-menu');
  if (!container) return;

  const menuWidth = 200;
  const menuHeight = 280;
  const x = Math.min(e.clientX, window.innerWidth - menuWidth);
  const y = Math.min(e.clientY, window.innerHeight - menuHeight);

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
        <span class="material-symbols-outlined text-sm">${store.get('favorites')?.includes(song.id) ? 'favorite' : 'favorite_border'}</span>
        ${store.get('favorites')?.includes(song.id) ? 'Remove from Favorites' : 'Add to Favorites'}
      </button>
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
      <div class="h-px bg-white/5 my-1"></div>
      <button role="menuitem" class="context-menu-item danger context-report">
        <span class="material-symbols-outlined text-sm">report</span>
        Report
      </button>
    </div>
  `);

  container.classList.remove('hidden');

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
      const favs = store.get('favorites') || [];
      const idx = favs.indexOf(song.id);
      if (idx > -1) favs.splice(idx, 1);
      else favs.push(song.id);
      store.setState('favorites', favs);
      import('./toast.js').then(m => m.showToast(idx > -1 ? 'Removed from favorites' : 'Added to favorites'));
    } else if (target.classList.contains('context-goto-playlist')) {
      import('../js/router.js').then(r => r.router.navigate(`/playlist/${playlistId}`));
    } else if (target.classList.contains('context-radio')) {
      import('./radio.js').then(m => m.startRadioSong(song.id, playlistId));
    } else if (target.classList.contains('context-share')) {
      shareSong(song, playlistId);
    } else if (target.classList.contains('context-report')) {
      import('./toast.js').then(m => m.showToast('Report submitted', 'success'));
    }
    closeMenu();
  };

  const handleKey = (e) => {
    if (e.key === 'Escape') closeMenu();
  };

  document.addEventListener('click', handleClick, { once: true });
  document.addEventListener('keydown', handleKey, { once: true });

  function closeMenu() {
    hide(container);
    container.innerHTML = '';
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
