import { $, html, getYouTubeThumbnail } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, animateEntrance } from '../js/ui.js';
import { GENRE_GROUPS } from '../config/genres.js';

export function renderHome() {
  const container = $('#page-view');
  if (!container) return;

  const playlists = store.get('playlists');
  const recentlyPlayed = store.get('recentlyPlayed');

  const featured = playlists.slice(0, 4);
  const allPlaylists = playlists;

  render(container, html`
    <div class="hero-section relative overflow-hidden pb-8">
      <div class="hero-glow absolute inset-0 pointer-events-none"></div>
      <div class="grid-bg absolute inset-0 pointer-events-none"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <div class="mb-6 logo-float">
          <span class="material-symbols-outlined text-7xl sm:text-8xl md:text-9xl text-gradient select-none block">library_music</span>
        </div>
        <h1 class="hero-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-3">
          Your music,<br>
          <span class="text-gradient">beautifully organized.</span>
        </h1>
        <p class="hero-subtitle text-lg text-slate-400 max-w-lg mx-auto mb-8">
          Discover curated playlists, find your favorites, and experience premium audio.
        </p>
        <div class="hero-buttons flex items-center justify-center gap-3 flex-wrap">
          <a href="#/playlist/${playlists[0]?.id}" class="btn-primary">
            <span class="material-symbols-outlined text-sm">play_arrow</span>
            Start Listening
          </a>
          <button class="btn-ghost search-hero-btn">
            <span class="material-symbols-outlined text-sm">search</span>
            Explore Music
          </button>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <section class="mb-8 animate-in">
        <div class="flex items-center justify-between mb-3">
          <h2 class="section-heading text-lg font-semibold text-white">Browse by Genre</h2>
          <a href="#/genres" class="text-xs text-brand hover:text-brand-hover transition-colors">View all</a>
        </div>
        <div class="flex gap-2 flex-wrap">
          ${GENRE_GROUPS.map(g => `
            <a href="#/genre-group/${g.id}" class="genre-chip flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-brand hover:text-white text-slate-300 text-sm transition-all">
              <span class="material-symbols-outlined text-sm">${g.icon}</span>
              ${g.name}
            </a>
          `).join('')}
        </div>
      </section>

      ${recentlyPlayed.length > 0 ? `
      <section class="mb-10 animate-in relative">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-heading text-lg font-semibold text-white">Recently Played</h2>
          ${recentlyPlayed.length > 6 ? `<a href="#/library" class="text-xs text-brand hover:text-brand-hover transition-colors">See all</a>` : ''}
        </div>
        <div class="relative">
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-none px-0.5 -mx-0.5 snap-x snap-mandatory" id="recently-played">
            ${recentlyPlayed.slice(0, 10).map(s => `
              <a href="#/playlist/${s.playlistId}" class="flex-shrink-0 w-44 snap-start group relative">
                <div class="rounded-xl overflow-hidden glass-card hover-scale transition-all">
                  <div class="aspect-square overflow-hidden bg-surface-elevated relative">
                    <img src="${getYouTubeThumbnail(s.youtube_id, 'mqdefault')}" alt="${s.title}"
                         class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy"
                         onerror="this.src='assets/images/fallback-album.svg'">
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                    <div class="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-brand shadow-lg shadow-brand/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <span class="material-symbols-outlined text-white text-sm">play_arrow</span>
                    </div>
                  </div>
                  <div class="p-2.5">
                    <p class="text-sm font-medium text-white truncate">${s.title}</p>
                    <p class="text-xs text-slate-400 truncate">${s.artist}</p>
                  </div>
                </div>
              </a>
            `).join('')}
          </div>
          <div class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0F1115] to-transparent pointer-events-none"></div>
          <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0F1115] to-transparent pointer-events-none"></div>
        </div>
      </section>
      ` : ''}

      <section class="mb-10 animate-in">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-heading text-lg font-semibold text-white">Featured Playlists</h2>
        </div>
        <div class="playlist-grid" id="featured-playlists"></div>
      </section>

      <section class="animate-in">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-heading text-lg font-semibold text-white">All Playlists</h2>
        </div>
        <div class="playlist-grid" id="all-playlists"></div>
      </section>
    </div>
  `);

  const featuredGrid = $('#featured-playlists');
  if (featuredGrid) {
    render(featuredGrid, renderPlaylistCards(featured));
  }

  const allGrid = $('#all-playlists');
  if (allGrid) {
    render(allGrid, renderPlaylistCards(allPlaylists));
  }

  container.addEventListener('click', (e) => {
    const searchBtn = e.target.closest('.search-hero-btn');
    if (searchBtn) {
      e.preventDefault();
      import('./search-modal.js').then(m => m.openSearch());
    }
  });

  setTimeout(() => animateEntrance(container, '.animate-in', 100), 50);
}

function renderPlaylistCards(playlists) {
  return playlists.map(pl => {
    const thumbSong = pl.songs[0] || pl.songs[Math.floor(Math.random() * pl.songs.length)];
    const thumbnail = thumbSong ? getYouTubeThumbnail(thumbSong.youtube_id, 'mqdefault') : 'assets/images/fallback-album.svg';

    return `
      <a href="#/playlist/${pl.id}" class="playlist-card glass-card rounded-xl overflow-hidden group">
        <div class="aspect-video relative overflow-hidden bg-surface-elevated">
          <img src="${thumbnail}" alt="${pl.name}"
               class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               loading="lazy" onerror="this.src='assets/images/fallback-album.svg'">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div class="absolute bottom-3 left-3 right-3">
            <h3 class="text-white font-semibold text-base truncate">${pl.name}</h3>
            <p class="text-xs text-slate-300 mt-0.5">${pl.songs.length} songs</p>
          </div>
          <div class="absolute top-3 right-3 w-10 h-10 rounded-full bg-brand-500 shadow-lg shadow-brand-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <span class="material-symbols-outlined text-white text-lg">play_arrow</span>
          </div>
        </div>
        <div class="p-3">
          <p class="text-xs text-slate-400 line-clamp-2">${pl.description || ''}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="text-[10px] text-slate-500">${pl.songs.length} tracks</span>
            <span class="text-[10px] text-slate-600">·</span>
            <span class="text-[10px] text-slate-500">${pl.songs.reduce((acc, s) => acc + parseDuration(s.duration), 0)} min</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

function parseDuration(d) {
  if (!d) return 0;
  const parts = d.split(':');
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return 0;
}
