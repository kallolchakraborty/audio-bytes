import { $, html } from '../js/utils.js';
import { store } from '../js/store.js';
import { render, staggerOnView } from '../js/ui.js';

export function renderHome() {
  const container = $('#page-view');
  if (!container) return;

  render(container, html`
    <div class="hero-section relative overflow-hidden px-6 flex items-center justify-center" style="min-height:calc(100vh - 80px - 56px);">
      <div class="hero-glow absolute inset-0 pointer-events-none"></div>
      <div class="grid-bg absolute inset-0 pointer-events-none"></div>

      <div class="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
        <div class="sparkle-hero-container mb-2 flex items-center justify-center">
          <span class="material-symbols-outlined select-none sparkle-gradient sparkle-hero-animate sparkle-hero-icon relative z-10">library_music</span>
        </div>

        <div class="flex flex-col gap-4">
          <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-normal">
            your music,<br>
            <span class="sparkle-gradient">beautifully organized.</span>
          </h1>
          <p class="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            audiobytes is a modern, search-first music player for curated playlists, favorites, and premium audio.
          </p>
        </div>

        <button class="open-search-btn w-full max-w-lg border border-white/10 hover:border-brand bg-slate-900/90 text-left px-5 py-3.5 rounded-xl shadow-lg shadow-black/20 flex items-center justify-between text-slate-400 font-medium text-sm transition-all group backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-slate-500 group-hover:text-brand transition-colors">search</span>
            <span>Search songs, artists, albums...</span>
          </div>
          <div class="flex items-center gap-1.5 font-mono text-xs">
            <kbd class="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-500">Ctrl</kbd>
            <kbd class="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-500">K</kbd>
          </div>
        </button>

        <a href="#/explore" class="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-600 text-white font-semibold rounded-lg shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all">
          <span>Get Started</span>
          <span class="material-symbols-outlined text-lg">arrow_forward</span>
        </a>
      </div>
    </div>
  `);

  container.addEventListener('click', (e) => {
    const searchBtn = e.target.closest('.open-search-btn');
    if (searchBtn) {
      e.preventDefault();
      import('./search-modal.js').then(m => m.openSearch());
    }
  });

  requestAnimationFrame(() => staggerOnView(container, '.hero-section h1', 50));
}
