import { $, html, getYouTubeThumbnail, formatTime } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, setPageTitle } from '../js/ui.js';

export function renderArtist(artistName) {
  const decoded = decodeURIComponent(artistName);
  const all = store.getAllSongs();
  const songs = all.filter(s => s.artist?.toLowerCase() === decoded.toLowerCase());
  if (!songs.length) return renderNotFound();
  setPageTitle(decoded);
  const albums = [...new Set(songs.filter(s => s.album).map(s => s.album.toLowerCase()))];
  const container = $('#page-view');
  render(container, detailView(decoded, 'person', songs, `${songs.length} song${songs.length !== 1 ? 's' : ''} · ${albums.length} album${albums.length !== 1 ? 's' : ''}`));
  bindDetailEvents(songs);
}

export function renderAlbum(albumName) {
  const decoded = decodeURIComponent(albumName);
  const all = store.getAllSongs();
  const songs = all.filter(s => s.album?.toLowerCase() === decoded.toLowerCase());
  if (!songs.length) return renderNotFound();
  setPageTitle(decoded);
  const artists = [...new Set(songs.map(s => s.artist))];
  const container = $('#page-view');
  render(container, detailView(decoded, 'album', songs, `${songs.length} song${songs.length !== 1 ? 's' : ''} · ${artists.join(', ')}`));
  bindDetailEvents(songs);
}

function renderNotFound() {
  const container = $('#page-view');
  if (!container) return;
  render(container, html`
    <div class="flex flex-col items-center justify-center py-20 gap-4">
      <span class="material-symbols-outlined text-5xl text-slate-600">search_off</span>
      <h1 class="text-2xl font-bold text-white">Not found</h1>
      <p class="text-slate-400 text-sm">No songs found for this artist or album.</p>
      <a href="#/" class="btn-primary mt-2">Go Home</a>
    </div>
  `);
}

function detailView(name, icon, songs, subtitle) {
  const firstSong = songs[0];
  const thumb = firstSong?.youtube_id ? getYouTubeThumbnail(firstSong.youtube_id, 'hqdefault') : 'assets/images/fallback-album.svg';
  return `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="mb-6">
        <button class="btn-ghost text-xs back-to-previous" aria-label="Go back">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
      </div>
      <div class="flex items-end gap-5 mb-8">
        <div class="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-xl shadow-black/40 flex-shrink-0">
          <img src="${thumb}" alt="${name || ''}" class="w-full h-full object-cover" loading="lazy" onerror="this.src='assets/images/fallback-album.svg'">
        </div>
        <div class="min-w-0 pb-1">
          <div class="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider mb-1">
            <span class="material-symbols-outlined text-sm">${icon}</span>
            ${icon === 'person' ? 'Artist' : 'Album'}
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold text-white truncate">${name}</h1>
          <p class="text-sm text-slate-400 mt-1">${subtitle}</p>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-6">
        <button class="detail-play-all btn-primary text-sm"><span class="material-symbols-outlined text-sm">play_arrow</span> Play All</button>
        <button class="detail-shuffle-all btn-secondary text-sm flex items-center gap-1"><span class="material-symbols-outlined text-sm">shuffle</span> Shuffle</button>
      </div>

      <div class="space-y-1" id="detail-song-list">
        ${songs.map((s, i) => songRow(s, i)).join('')}
      </div>
    </div>
  `;
}

function songRow(song, index) {
  const thumb = song.youtube_id ? getYouTubeThumbnail(song.youtube_id, 'default') : 'assets/images/fallback-album.svg';
  const isFav = store.getLikedIds().includes(song.id);
  return `
    <div class="detail-row flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group" data-song-idx="${index}">
      <span class="text-xs text-slate-500 w-6 text-right flex-shrink-0 tabular-nums">${index + 1}</span>
      <img src="${thumb}" alt="${song.title || ''}" class="w-10 h-10 rounded object-cover flex-shrink-0" loading="lazy" onerror="this.src='assets/images/fallback-album.svg'">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white truncate">${song.title}</p>
        <p class="text-xs text-slate-400 truncate">${song.artist}${song.album ? ` · ${song.album}` : ''}</p>
      </div>
      <span class="text-xs text-slate-500 tabular-nums">${song.duration || ''}</span>
      <button class="detail-fav-btn btn-icon w-7 h-7 text-sm ${isFav ? 'text-red-400' : 'text-slate-500'} opacity-0 group-hover:opacity-100 transition-opacity" data-song-id="${song.id}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
        <span class="material-symbols-outlined text-sm">${isFav ? 'favorite' : 'favorite_border'}</span>
      </button>
    </div>
  `;
}

function bindDetailEvents(songs) {
  const container = $('#page-view');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const backBtn = e.target.closest('.back-to-previous');
    if (backBtn) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        import('../js/router.js').then(r => r.router.navigate('/'));
      }
      return;
    }

    const row = e.target.closest('.detail-row');
    if (row && !e.target.closest('.detail-fav-btn')) {
      const idx = parseInt(row.dataset.songIdx);
      const song = songs[idx];
      const playlistSongs = store.getAllSongs();
      const plSong = playlistSongs.find(s => s.id === song.id);
      if (plSong) {
        store.playSong(plSong, plSong.playlistId, plSong.playlistName, plSong.playlistCover);
      }
      return;
    }

    const favBtn = e.target.closest('.detail-fav-btn');
    if (favBtn) {
      const songId = favBtn.dataset.songId;
      store.toggleFavorite(songId);
      const icon = favBtn.querySelector('.material-symbols-outlined');
      if (icon) {
        const now = store.getLikedIds().includes(songId);
        icon.textContent = now ? 'favorite' : 'favorite_border';
        favBtn.classList.toggle('text-red-400', now);
        favBtn.classList.toggle('text-slate-500', !now);
        favBtn.setAttribute('aria-label', now ? 'Remove from favorites' : 'Add to favorites');
      }
      return;
    }

    const playAll = e.target.closest('.detail-play-all');
    if (playAll) {
      const songsWithContext = songs.map(s => {
        const full = store.getAllSongs().find(f => f.id === s.id);
        return full || s;
      });
      store.playFromQueue(songsWithContext, 0);
      return;
    }

    const shuffleAll = e.target.closest('.detail-shuffle-all');
    if (shuffleAll) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      const songsWithContext = shuffled.map(s => {
        const full = store.getAllSongs().find(f => f.id === s.id);
        return full || s;
      });
      store.playFromQueue(songsWithContext, 0);
      store.setState('shuffle', true);
      return;
    }
  });
}
