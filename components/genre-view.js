import { $, getYouTubeThumbnail } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, setPageTitle } from '../js/ui.js';
import { GENRE_GROUPS, getPlaylistsForGroup } from '../config/genres.js';
import { closeSidebar } from './sidebar.js';

export function renderGenres() {
  const container = $('#page-view');
  if (!container) return;
  setPageTitle('Genres');

  render(container, `
    <div class="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div class="flex items-center gap-3 mb-8">
        <span class="material-symbols-outlined text-2xl text-slate-400">explore</span>
        <h1 class="text-2xl font-bold text-white">Browse by Genre</h1>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        ${GENRE_GROUPS.map(g => {
          const playlists = getPlaylistsForGroup(g.id, store.get('playlists'));
          const totalSongs = playlists.reduce((sum, pl) => sum + (pl.songs?.length || 0), 0);
          const firstPl = playlists[0];
          const thumb = firstPl?.cover ? `assets/images/${firstPl.cover}` : 'assets/images/fallback-album.svg';
          return `
            <a href="#/genre-group/${g.id}" class="genre-group-card block rounded-2xl overflow-hidden bg-white/5 hover:bg-white/10 transition-all group cursor-pointer">
              <div class="aspect-[2/1] overflow-hidden relative">
                <img src="${thumb}" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='assets/images/fallback-album.svg'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div class="absolute bottom-3 left-4">
                  <span class="material-symbols-outlined text-white/80 text-lg">${g.icon}</span>
                  <h3 class="text-lg font-bold text-white mt-1">${g.name}</h3>
                </div>
              </div>
              <div class="p-4">
                <p class="text-sm text-slate-400 line-clamp-2">${g.description}</p>
                <div class="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  <span>${playlists.length} sub-genres</span>
                  <span>·</span>
                  <span>${totalSongs} songs</span>
                </div>
                <div class="flex flex-wrap gap-1.5 mt-3">
                  ${playlists.slice(0, 4).map(pl => `
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">${pl.name}</span>
                  `).join('')}
                  ${playlists.length > 4 ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500">+${playlists.length - 4}</span>` : ''}
                </div>
              </div>
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `);

  closeSidebar();
}

export function renderGenreGroup(groupId) {
  const container = $('#page-view');
  if (!container) return;

  const group = GENRE_GROUPS.find(g => g.id === groupId);
  if (!group) {
    render(container, notFound());
    return;
  }
  setPageTitle(group.name);

  const playlists = getPlaylistsForGroup(groupId, store.get('playlists'));
  if (!playlists.length) {
    render(container, notFound());
    return;
  }

  const totalSongs = playlists.reduce((sum, pl) => sum + (pl.songs?.length || 0), 0);
  const firstPl = playlists[0];
  const thumb = firstPl?.cover ? `assets/images/${firstPl.cover}` : 'assets/images/fallback-album.svg';

  render(container, `
    <div class="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div class="flex items-end gap-5 mb-8">
        <div class="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-xl shadow-black/40 flex-shrink-0">
          <img src="${thumb}" alt="" class="w-full h-full object-cover" onerror="this.src='assets/images/fallback-album.svg'">
        </div>
        <div class="min-w-0 pb-1">
          <div class="flex items-center gap-2 text-xs text-slate-400 uppercase tracking-wider mb-1">
            <span class="material-symbols-outlined text-sm">${group.icon}</span>
            Genre Group
          </div>
          <h1 class="text-3xl sm:text-4xl font-bold text-white">${group.name}</h1>
          <p class="text-sm text-slate-400 mt-1">${group.description}</p>
          <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span>${playlists.length} sub-genres</span>
            <span>·</span>
            <span>${totalSongs} songs</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${playlists.map(pl => renderPlaylistCard(pl)).join('')}
      </div>
    </div>
  `);

  closeSidebar();
}

function renderPlaylistCard(pl) {
  const thumb = pl.cover ? `assets/images/${pl.cover}` : 'assets/images/fallback-album.svg';
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
        <img src="${songThumb || thumb}" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='assets/images/fallback-album.svg'">
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        <div class="absolute bottom-3 left-3 right-3">
          <h3 class="text-base font-bold text-white truncate">${pl.name}</h3>
          <p class="text-xs text-slate-300 mt-0.5">${pl.songs?.length || 0} songs · ${mins} min</p>
        </div>
        <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span class="w-10 h-10 rounded-full bg-brand flex items-center justify-center shadow-lg shadow-brand/30">
            <span class="material-symbols-outlined text-white text-lg">play_arrow</span>
          </span>
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

function notFound() {
  return `
    <div class="flex flex-col items-center justify-center py-20 gap-4">
      <span class="material-symbols-outlined text-5xl text-slate-600">search_off</span>
      <h1 class="text-2xl font-bold text-white">Genre group not found</h1>
      <a href="#/genres" class="btn-primary mt-2">Browse Genres</a>
    </div>
  `;
}
