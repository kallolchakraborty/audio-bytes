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
        <button class="btn-icon sidebar-toggle text-sm hidden md:flex" aria-label="Toggle sidebar" aria-expanded="false">
          <span class="material-symbols-outlined text-lg">menu</span>
        </button>
        <a href="#/" class="flex items-center gap-2 text-white hover:text-brand transition-colors" aria-label="Home">
          <span class="material-symbols-outlined text-brand text-lg">library_music</span>
          <span class="font-bold text-sm tracking-tight">AudioBytes</span>
        </a>
      </div>

      <div class="hidden md:flex flex-1 max-w-md mx-4">
        <button class="inline-search-trigger flex items-center gap-2 w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-400 hover:text-white hover:border-white/20 transition-all text-left">
          <span class="material-symbols-outlined text-sm">search</span>
          <span>Search songs, artists, genres...</span>
          <span class="ml-auto text-[10px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded">Ctrl+K</span>
        </button>
      </div>

      <div class="flex items-center gap-1">
        <button class="btn-icon search-toggle text-sm md:hidden" aria-label="Search (Ctrl+K)">
          <span class="material-symbols-outlined text-lg">search</span>
        </button>

        <button class="btn-icon settings-toggle text-sm hidden sm:flex" aria-label="Settings">
          <span class="material-symbols-outlined text-lg">settings</span>
        </button>

        <button class="btn-icon md:hidden menu-toggle text-sm" aria-label="Toggle menu" aria-expanded="false">
          <span class="material-symbols-outlined text-lg">menu</span>
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
        <button class="mobile-nav-link mobile-search-btn flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors w-full text-left">
          <span class="material-symbols-outlined text-lg">search</span>
          Search Music
        </button>
      </div>
    </div>
  `);

  container.addEventListener('click', (e) => {
    const searchBtn = e.target.closest('.search-toggle');
    if (searchBtn) {
      e.preventDefault();
      import('./search-modal.js').then(m => m.openSearch());
      return;
    }

    const inlineSearch = e.target.closest('.inline-search-trigger');
    if (inlineSearch) {
      import('./search-modal.js').then(m => m.openSearch());
      return;
    }

    const settingsBtn = e.target.closest('.settings-toggle');
    if (settingsBtn) {
      import('./settings-panel.js').then(m => m.toggleSettings());
      return;
    }

    const sidebarToggle = e.target.closest('.sidebar-toggle');
    if (sidebarToggle) {
      import('./sidebar.js').then(m => {
        m.toggleSidebar();
        const isCollapsed = $('#app')?.classList.contains('sidebar-collapsed');
        sidebarToggle.setAttribute('aria-expanded', String(!isCollapsed));
      });
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

    const mobileSearchBtn = e.target.closest('.mobile-search-btn');
    if (mobileSearchBtn) {
      e.preventDefault();
      $('#mobile-nav')?.classList.add('hidden');
      const menuIcon = $('.menu-toggle .material-symbols-outlined');
      if (menuIcon) menuIcon.textContent = 'menu';
      import('./search-modal.js').then(m => m.openSearch());
    }
  });
}
