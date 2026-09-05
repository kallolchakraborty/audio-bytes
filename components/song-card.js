import { $, html, create, getYouTubeThumbnail } from '../js/utils.js';
import { store } from '../js/store.js';
import { render } from '../js/ui.js';

function addLongPress(el, callback) {
  let timer = null;
  let sx = 0, sy = 0;
  const threshold = 10;

  const start = (e) => {
    sx = e.changedTouches[0].screenX;
    sy = e.changedTouches[0].screenY;
    timer = setTimeout(() => {
      timer = null;
      callback(e);
    }, 500);
  };

  const move = (e) => {
    if (!timer) return;
    const dx = Math.abs(e.changedTouches[0].screenX - sx);
    const dy = Math.abs(e.changedTouches[0].screenY - sy);
    if (dx > threshold || dy > threshold) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const end = () => { if (timer) { clearTimeout(timer); timer = null; } };

  el.addEventListener('touchstart', start, { passive: true });
  el.addEventListener('touchmove', move, { passive: true });
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
}

function makeTouchEvent(touch) {
  return { clientX: touch.clientX, clientY: touch.clientY, preventDefault() {}, target: touch.target };
}

export function renderSongCards(container, songs, playlistId, playlistName, playlistCover) {
  if (!container || !songs?.length) return;

  const fragment = document.createDocumentFragment();

  songs.forEach((song, index) => {
    const thumbnail = song.artwork || getYouTubeThumbnail(song.youtube_id, 'mqdefault');
    const isPlaying = store.get('currentSong')?.id === song.id &&
                      store.get('currentSong')?.playlistId === playlistId;

    const card = create('div', {
      className: `song-card glass-card rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 animate-in ${isPlaying ? 'ring-1 ring-brand-500/50' : ''}`,
      tabindex: '0',
      role: 'button',
      'aria-label': `Play ${song.title} by ${song.artist}`
    });

    card.innerHTML = `
      <div class="relative aspect-square overflow-hidden bg-surface-elevated">
        <img src="${thumbnail}" alt="${song.title}"
             class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
             loading="lazy" decoding="async"
             onerror="this.src='assets/images/fallback-album.svg'">
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div class="play-btn w-12 h-12 rounded-full bg-brand-500 shadow-lg shadow-brand-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
            <span class="material-symbols-outlined text-white text-2xl">play_arrow</span>
          </div>
        </div>
        ${song.genre ? `<span class="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full bg-black/60 text-brand-400 font-medium backdrop-blur-sm">${song.genre}</span>` : ''}
        ${song.year ? `<span class="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-black/60 text-slate-300 font-medium backdrop-blur-sm">${song.year}</span>` : ''}
        ${isPlaying ? `
        <div class="absolute bottom-2 left-2 flex items-end gap-[2px] h-4">
          ${'<div class="equalizer-bar w-[3px] rounded-full bg-brand-500"></div>'.repeat(4)}
        </div>` : ''}
      </div>
      <div class="p-3">
        <h3 class="font-semibold text-sm text-white truncate group-hover:text-brand-500 transition-colors">${song.title}</h3>
        <p class="text-xs text-slate-400 truncate mt-0.5">${song.artist}</p>
        <div class="flex items-center justify-between mt-1.5">
          <span class="text-[11px] text-slate-500 truncate flex-1 min-w-0">${song.album || ''}</span>
          <span class="text-[11px] text-slate-500 flex-shrink-0 ml-2">${song.duration}</span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-[10px] text-slate-600">${song.year || ''}</span>
          ${song.genre ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-brand/10 text-brand font-medium truncate">${song.genre}</span>` : ''}
          ${song.is_hd ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-brand/20 text-brand font-bold uppercase tracking-wider ml-auto">HD</span>` : ''}
        </div>
      </div>
    `;

    card.dataset.index = index;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.play-btn')) {
        store.playSong(song, playlistId, playlistName, playlistCover);
        return;
      }
      store.playSong(song, playlistId, playlistName, playlistCover);
    });

    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      import('./context-menu.js').then(m => m.showContextMenu(e, song, playlistId, playlistName, playlistCover));
    });

    addLongPress(card, (e) => {
      e.preventDefault();
      const ev = makeTouchEvent(e.changedTouches[0]);
      import('./context-menu.js').then(m => m.showContextMenu(ev, song, playlistId, playlistName, playlistCover));
    });

    fragment.appendChild(card);
  });

  render(container, fragment);
}

export function renderSongRows(container, songs, playlistId, playlistName, playlistCover) {
  if (!container || !songs?.length) return;

  const currentSong = store.get('currentSong');
  const isPlaying = store.get('isPlaying');

  const fragment = document.createDocumentFragment();

  songs.forEach((song, index) => {
    const isCurrent = currentSong?.id === song.id && currentSong?.playlistId === playlistId;

    const row = create('div', {
      className: `song-row group animate-in ${isCurrent ? 'playing' : ''}`,
      tabindex: '0',
      role: 'button',
      'aria-label': `Play ${song.title} by ${song.artist}`
    });

    row.innerHTML = `
      <span class="text-sm text-slate-500 w-6 text-right song-number">
        ${isCurrent && isPlaying
          ? `<div class="flex items-end gap-[2px] h-3 justify-center">${'<div class="equalizer-bar w-[3px] rounded-full bg-brand"></div>'.repeat(4)}</div>`
          : `<span class="text-xs text-slate-600 group-hover:hidden">${index + 1}</span>
             <span class="hidden group-hover:flex items-center justify-center w-6 h-6">
               <span class="material-symbols-outlined text-white text-sm">play_arrow</span>
             </span>`}
      </span>
      <div class="flex items-center gap-3 min-w-0">
        <img src="${getYouTubeThumbnail(song.youtube_id, 'default')}" alt="${song.title || ''}"
             class="w-10 h-10 rounded object-cover flex-shrink-0"
             loading="lazy" onerror="this.src='assets/images/fallback-album.svg'">
        <div class="min-w-0">
          <span class="song-title text-sm font-medium text-white truncate block group-hover:text-brand transition-colors">${song.title}</span>
          <span class="text-xs text-slate-400 truncate block">${song.artist}</span>
        </div>
      </div>
      <span class="text-xs text-slate-500 song-album hidden sm:block truncate">${song.album || ''}</span>
      <span class="text-xs text-slate-500 song-genre hidden lg:block truncate">${song.genre || ''}</span>
      <span class="text-xs text-slate-500 song-year hidden md:block">${song.year || ''}</span>
      <span class="text-xs text-slate-500 song-duration">${song.duration}</span>
      ${song.is_hd ? `<span class="text-[10px] px-1.5 py-0.5 rounded bg-brand/20 text-brand font-bold uppercase tracking-wider song-quality">HD</span>` : `<span class="w-6 inline-block"></span>`}
      <button class="btn-icon w-8 h-8 text-sm fav-btn ${store.getLikedIds().includes(song.id) ? 'active' : ''}"
              aria-label="Toggle favorite" data-song-id="${song.id}">
        <span class="material-symbols-outlined text-sm">${store.getLikedIds().includes(song.id) ? 'favorite' : 'favorite_border'}</span>
      </button>
    `;

    row.addEventListener('click', (e) => {
      if (e.target.closest('.fav-btn')) return;
      const queue = songs.map((s, i) => ({ ...s, playlistId, playlistName, playlistCover }));
      store.playFromQueue(queue, index);
    });

    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      import('./context-menu.js').then(m => m.showContextMenu(e, song, playlistId, playlistName, playlistCover));
    });

    addLongPress(row, (e) => {
      e.preventDefault();
      const ev = makeTouchEvent(e.changedTouches[0]);
      import('./context-menu.js').then(m => m.showContextMenu(ev, song, playlistId, playlistName, playlistCover));
    });

    const favBtn = row.querySelector('.fav-btn');
    if (favBtn) {
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(song.id);
      });
    }

    fragment.appendChild(row);
  });

  render(container, fragment);
}

function toggleFavorite(songId) {
  const prev = store.toggleFavorite(songId);
  import('./toast.js').then(m => m.showToast(prev === 'removed' ? 'Removed from favorites' : 'Added to favorites'));
}
