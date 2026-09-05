import { $, getYouTubeThumbnail } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, setPageTitle } from '../js/ui.js';
import { getPlaylistsForGroup, GENRE_GROUPS } from '../config/genres.js';
import { closeSidebar } from './sidebar.js';

export function renderGenres() {
  const container = $('#page-view');
  if (!container) return;
  setPageTitle('Browse All');

  const allPlaylists = store.get('playlists');
  const groups = GENRE_GROUPS.map(group => ({
    group,
    playlists: getPlaylistsForGroup(group.id, allPlaylists)
  }));

  render(container, `
    <div class="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-12">
      ${groups.map(({ group, playlists }) => {
        const totalSongs = playlists.reduce((sum, pl) => sum + (pl.songs?.length || 0), 0);
        return `
          <section>
            <div class="flex items-center gap-3 mb-8">
              <span class="material-symbols-outlined text-2xl text-slate-400">${group.icon}</span>
              <h1 class="text-2xl font-bold text-white">${group.name}</h1>
              <span class="text-sm text-slate-500 ml-auto">${playlists.length} playlists · ${totalSongs} songs</span>
            </div>
            <p class="text-sm text-slate-400 -mt-4 mb-6">${group.description}</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              ${playlists.map(pl => renderPlaylistCard(pl)).join('')}
            </div>
          </section>
        `;
      }).join('')}
    </div>
  `);

  container.querySelectorAll('.genre-card-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const playlistId = btn.dataset.playlistId;
      const pl = store.getPlaylist(playlistId);
      if (pl && pl.songs?.length) {
        store.playPlaylist(playlistId, 0);
      }
    });
  });

  closeSidebar();
}

export function renderGenreGroup() {
  renderGenres();
}

function renderPlaylistCard(pl) {
  const thumb = pl.cover ? pl.cover : 'assets/images/fallback-album.svg';
  const firstSong = pl.songs?.[0];
  const songThumb = firstSong?.youtube_id ? getYouTubeThumbnail(firstSong.youtube_id, 'default') : null;
  const totalDuration = pl.songs?.reduce((sum, s) => {
    if (!s.duration) return sum;
    const [m, sec] = s.duration.split(':').map(Number);
    return sum + (m * 60 + (sec || 0));
  }, 0) || 0;
  const mins = Math.floor(totalDuration / 60);

  return `
    <a href="#/playlist/${pl.id}" class="genre-playlist-card block rounded-2xl overflow-hidden bg-white/5 hover:bg-white/10 transition-all group">
      <div class="aspect-[3/2] overflow-hidden relative">
        <img src="${songThumb || thumb}" alt="${pl.name || ''}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.src='assets/images/fallback-album.svg'">
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        <div class="absolute bottom-3 left-3 right-3">
          <h3 class="text-base font-bold text-white truncate">${pl.name}</h3>
          <p class="text-xs text-slate-300 mt-0.5">${pl.songs?.length || 0} songs · ${mins} min</p>
        </div>
        <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="genre-card-play-btn w-10 h-10 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/30 hover:scale-110 active:scale-95 transition-transform" data-playlist-id="${pl.id}" title="Play ${pl.name}">
            <span class="material-symbols-outlined text-white text-lg">play_arrow</span>
          </button>
        </div>
      </div>
      <div class="p-3">
        <p class="text-xs text-slate-500 line-clamp-2">${pl.description || ''}</p>
        <div class="flex flex-wrap gap-1 mt-2">
          ${[...new Set(pl.songs?.map(s => s.genre).filter(Boolean))].slice(0, 3).map(g => `
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-brand/10 text-brand-300">${g}</span>
          `).join('')}
        </div>
      </div>
    </a>
  `;
}
