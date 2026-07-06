import { $ } from '../js/utils.js';
import { store } from '../js/store.js';
import { GENRE_GROUPS } from '../config/genres.js';

let _expandedGroups = new Set();
let _unsub = null;

export function renderSidebar() {
  const container = $('#sidebar');
  if (!container) return;

  renderContent(container);
  bindEvents(container);

  _unsub = store.on('change', ({ path }) => {
    if (path === 'playlists') renderContent(container);
  });
}

function renderContent(container) {
  const playlists = store.get('playlists') || [];
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
            Genres
          </a>

          <div class="mt-1 ml-3 space-y-0.5">
            ${GENRE_GROUPS.map(g => `
              <div class="sidebar-group">
                <button class="sidebar-group-toggle flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-left" data-group="${g.id}">
                  <span class="material-symbols-outlined text-sm sidebar-group-chevron transition-transform ${_expandedGroups.has(g.id) ? 'rotate-90' : ''}">chevron_right</span>
                  <span class="material-symbols-outlined text-sm">${g.icon}</span>
                  ${g.name}
                </button>
                <div class="sidebar-subgenres ml-3 space-y-0.5 ${_expandedGroups.has(g.id) ? '' : 'hidden'}">
                  ${g.playlists.map(plId => {
                    const pl = playlists.find(p => p.id === plId);
                    if (!pl) return '';
                    const isActive = hash === `#/playlist/${plId}`;
                    return `<a href="#/playlist/${plId}" class="sidebar-sub-item flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-colors ${isActive ? 'text-white bg-white/5' : ''}">${pl.name}</a>`;
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="pt-3">
          <p class="px-3 text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-1">Playlists</p>
          ${playlists.slice(0, 10).map(pl => {
            const isActive = hash === `#/playlist/${pl.id}`;
            return `<a href="#/playlist/${pl.id}" class="sidebar-nav-item flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors ${isActive ? 'active' : ''}"><span class="material-symbols-outlined text-sm">playlist_play</span>${pl.name}</a>`;
          }).join('')}
          ${playlists.length > 10 ? `<a href="#/genres" class="sidebar-nav-item flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-white hover:bg-white/5 transition-colors">+${playlists.length - 10} more</a>` : ''}
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
    const groupToggle = e.target.closest('.sidebar-group-toggle');
    if (groupToggle) {
      const groupId = groupToggle.dataset.group;
      if (_expandedGroups.has(groupId)) _expandedGroups.delete(groupId);
      else _expandedGroups.add(groupId);
      const sub = groupToggle.nextElementSibling;
      if (sub) sub.classList.toggle('hidden');
      const chevron = groupToggle.querySelector('.sidebar-group-chevron');
      if (chevron) chevron.classList.toggle('rotate-90');
      return;
    }

    const navLink = e.target.closest('.sidebar-nav-item[data-route], .sidebar-sub-item');
    if (navLink) {
      const route = navLink.dataset.route;
      if (route === '/genres') {
        closeSidebarOnMobile();
      } else {
        closeSidebarOnMobile();
      }
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
