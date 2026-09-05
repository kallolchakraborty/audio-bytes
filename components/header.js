import { $, html } from '../js/utils.js';
import { render } from '../js/ui.js';

let _offlineIndicator = null;

export function renderHeader() {
  const container = $('#app-header');
  if (!container) return;

  // Offline indicator
  if (!_offlineIndicator) {
    _offlineIndicator = document.createElement('div');
    _offlineIndicator.id = 'offline-indicator';
    _offlineIndicator.className = 'hidden text-center text-[10px] text-yellow-400 bg-yellow-500/10 py-1 font-medium';
    _offlineIndicator.textContent = 'Offline — showing cached content';
    container.parentNode.insertBefore(_offlineIndicator, container.nextSibling);
  }
  window.addEventListener('online', () => _offlineIndicator?.classList.add('hidden'));
  window.addEventListener('offline', () => _offlineIndicator?.classList.remove('hidden'));

  render(container, html`
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <a href="#/" class="flex items-center gap-2 text-white hover:text-brand transition-colors" aria-label="Home">
          <span class="material-symbols-outlined text-brand text-lg">library_music</span>
          <span class="font-bold text-sm tracking-tight">AudioBytes</span>
        </a>
      </div>

      <div class="flex items-center gap-1">
        <button class="btn-icon md:hidden menu-toggle text-sm" aria-label="Toggle menu" aria-expanded="false">
          <span class="material-symbols-outlined text-lg">menu</span>
        </button>
        <button class="btn-icon hack-toggle text-sm" aria-label="Hack" title="Hack">
          <span class="material-symbols-outlined text-lg">terminal</span>
        </button>
      </div>
    </div>

    <div id="mobile-nav" class="hidden md:hidden border-t border-white/5 bg-surface-elevated/95 backdrop-blur-xl">
      <div class="px-4 py-3 flex flex-col gap-1 max-h-60 overflow-y-auto">
        <a href="#/" class="mobile-nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
          <span class="material-symbols-outlined text-lg">explore</span>
          Browse Playlists
        </a>
        <a href="#/genres" class="mobile-nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
          <span class="material-symbols-outlined text-lg">category</span>
          Genres
        </a>
        <a href="#/library" class="mobile-nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
          <span class="material-symbols-outlined text-lg">favorite</span>
          Library
        </a>
      </div>
    </div>
  `);

  container.addEventListener('click', (e) => {
    const hackBtn = e.target.closest('.hack-toggle');
    if (hackBtn) {
      import('./toast.js').then(m => m.showToast('Hack mode activated', 'success'));
      return;
    }

    const menuBtn = e.target.closest('.menu-toggle');
    if (menuBtn) {
      const mobileNav = $('#mobile-nav');
      if (mobileNav) {
        const opening = mobileNav.classList.contains('hidden');
        mobileNav.classList.toggle('hidden');
        menuBtn.querySelector('.material-symbols-outlined').textContent =
          opening ? 'close' : 'menu';
        menuBtn.setAttribute('aria-expanded', String(opening));
      }
      return;
    }

    const link = e.target.closest('.mobile-nav-link');
    if (link) {
      $('#mobile-nav')?.classList.add('hidden');
      const menuIcon = $('.menu-toggle .material-symbols-outlined');
      if (menuIcon) menuIcon.textContent = 'menu';
    }
  });
}
