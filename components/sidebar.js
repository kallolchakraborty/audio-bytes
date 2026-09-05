import { $ } from '../js/utils.js';
import { store } from '../js/store.js';

let _unsub = null;

export function renderSidebar() {
  const container = $('#sidebar');
  if (!container) return;

  renderContent(container);
  bindEvents(container);

  _unsub = store.on('change', ({ path }) => {
    if (path === 'playlists' || path === 'myPlaylists') renderContent(container);
  });
}

function renderContent(container) {
  const playlists = store.get('playlists') || [];
  const myPlaylists = store.get('myPlaylists') || [];
  const hash = window.location.hash;

  container.innerHTML = `
    <div class="flex flex-col h-full">
      <div class="px-4 py-4 border-b border-white/5">
        <a href="#/" class="flex items-center gap-2 text-white hover:text-brand transition-colors sidebar-nav-item ${hash === '#/' || hash === '' ? 'active' : ''}" data-route="/">
          <span class="material-symbols-outlined text-brand text-lg">library_music</span>
          <span class="font-bold text-sm">AudioBytes</span>
        </a>
      </div>

      <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-1" aria-label="Sidebar navigation">
        <a href="#/" class="sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${hash === '#/' || hash === '' ? 'active' : ''}" data-route="/">
          <span class="material-symbols-outlined text-lg">home</span>
          Home
        </a>

        <a href="#/library" class="sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${hash === '#/library' ? 'active' : ''}" data-route="/library">
          <span class="material-symbols-outlined text-lg">favorite</span>
          Library
        </a>

        <div class="pt-3 pb-1">
          <a href="#/genres" class="sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${hash === '#/genres' ? 'active' : ''}" data-route="/genres">
            <span class="material-symbols-outlined text-lg">explore</span>
            Browse All
          </a>
        </div>

        <div class="pt-3">
          <p class="px-3 text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">Playlists</p>
          ${playlists.map(pl => {
            const isActive = hash === `#/playlist/${pl.id}`;
            return `<a href="#/playlist/${pl.id}" class="sidebar-nav-item flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${isActive ? 'active' : ''}"><span class="material-symbols-outlined text-sm">playlist_play</span>${pl.name}</a>`;
          }).join('')}
        </div>

        <div class="pt-2">
          <p class="px-3 text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">My Playlists</p>
          ${myPlaylists.length === 0 ? '<p class="px-3 text-[10px] text-slate-600 italic">No custom playlists yet</p>' : ''}
          ${myPlaylists.map(pl => {
            const isActive = hash === `#/playlist/${pl.id}`;
            return `<a href="#/playlist/${pl.id}" class="sidebar-nav-item flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${isActive ? 'active' : ''}"><span class="material-symbols-outlined text-sm">playlist_play</span>${pl.name}</a>`;
          }).join('')}
          <button class="sidebar-create-pl flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-colors w-full text-left mt-1">
            <span class="material-symbols-outlined text-sm">add</span>
            Create Playlist
          </button>
        </div>
      </nav>

      <div class="px-2 py-3 border-t border-white/5">
        <button class="sidebar-settings sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left">
          <span class="material-symbols-outlined text-lg">settings</span>
          Settings
        </button>
      </div>
    </div>
  `;
}

export function toggleSidebar() {
  const app = $('#app');
  if (!app) return;
  const isCollapsed = app.classList.contains('sidebar-collapsed');
  if (isCollapsed) {
    openSidebar();
    renderContent($('#sidebar'));
  } else {
    closeSidebar();
  }
}

let _sidebarLastFocus = null;
let _sidebarKeyHandler = null;

export function closeSidebar() {
  const app = $('#app');
  if (app) app.classList.add('sidebar-collapsed');
  document.querySelectorAll('#header, #page-view, #player-bar, #toast-container').forEach(el => el?.removeAttribute('aria-hidden'));
  if (_sidebarKeyHandler) {
    document.removeEventListener('keydown', _sidebarKeyHandler);
    _sidebarKeyHandler = null;
  }
  if (_sidebarLastFocus) { _sidebarLastFocus.focus(); _sidebarLastFocus = null; }
}

export function openSidebar() {
  const app = $('#app');
  if (app) app.classList.remove('sidebar-collapsed');
  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    document.querySelectorAll('#header, #page-view, #player-bar, #toast-container').forEach(el => el?.setAttribute('aria-hidden', 'true'));
    _sidebarLastFocus = document.activeElement;
    if (!_sidebarKeyHandler) {
      _sidebarKeyHandler = (e) => { if (e.key === 'Escape') closeSidebar(); };
      document.addEventListener('keydown', _sidebarKeyHandler);
    }
  }
}

function bindEvents(container) {
  container.addEventListener('click', (e) => {
    const createBtn = e.target.closest('.sidebar-create-pl');
    if (createBtn) {
      showCreatePlaylistModal();
      closeSidebarOnMobile();
      return;
    }

    const navLink = e.target.closest('.sidebar-nav-item');
    if (navLink) {
      closeSidebarOnMobile();
      return;
    }

    const settingsBtn = e.target.closest('.sidebar-settings');
    if (settingsBtn) {
      import('./settings-panel.js').then(m => m.toggleSettings());
      closeSidebarOnMobile();
      return;
    }
  });

  container.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#/')) {
      closeSidebarOnMobile();
    }
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth < 768) {
      const sidebar = $('#sidebar');
      if (sidebar && !sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle') && !e.target.closest('.menu-toggle')) {
        closeSidebar();
      }
    }
  });
}

function closeSidebarOnMobile() {
  if (window.innerWidth < 768) closeSidebar();
}

function showCreatePlaylistModal() {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/60';
  overlay.innerHTML = `
    <div class="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" role="dialog" aria-modal="true" aria-label="Create playlist">
      <h2 class="text-lg font-bold text-white mb-4">Create Playlist</h2>
      <input type="text" class="create-pl-input w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-brand" placeholder="Playlist name" maxlength="60" autofocus>
      <div class="flex justify-end gap-2 mt-4">
        <button class="create-pl-cancel px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
        <button class="create-pl-submit px-4 py-2 rounded-lg text-sm bg-brand text-white hover:bg-brand-hover transition-colors disabled:opacity-40" disabled>Create</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('.create-pl-input');
  const submit = overlay.querySelector('.create-pl-submit');

  input.addEventListener('input', () => {
    submit.disabled = !input.value.trim();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !submit.disabled) submit.click();
    if (e.key === 'Escape') overlay.remove();
  });

  submit.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) return;
    store.createPlaylist(name);
    overlay.remove();
  });

  overlay.querySelector('.create-pl-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}
