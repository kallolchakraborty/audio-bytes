import { store } from './store.js';
import { router } from './router.js';
import { player } from './player.js';
import { $, isTouchDevice } from './utils.js';
import { renderHomeSkeleton, renderSongGridSkeleton, renderPlaylistSkeleton } from '../components/skeleton.js';

async function init() {
  const container = $('#page-view');

  renderHomeSkeleton(container);

  await store.loadPlaylists();

  const { renderHeader } = await import('../components/header.js');
  renderHeader();

  const { renderPlayerBar } = await import('../components/player-bar.js');
  renderPlayerBar();

  const { initSearchModal } = await import('../components/search-modal.js');
  initSearchModal();

  setupKeyboardShortcuts();
  setupRouter();
  setupScrollProgress();
  setupBackToTop();
  setupServiceWorker();
  setupReducedMotion();
  setupTouchGestures();
  setupPullToRefresh();

  router.start();
}

function setupRouter() {
  router.route('/', async () => {
    const { renderHome } = await import('../components/home.js');
    renderHome();
  });

  router.route('/playlist/:id', async (params) => {
    const { renderPlaylist } = await import('../components/playlist-view.js');
    renderPlaylist(params.id);
  });

  router.route('/search', async () => {
    const { openSearch } = await import('../components/search-modal.js');
    openSearch();
  });

  router.route('/library', async () => {
    const { renderLibrary } = await import('../components/library.js');
    renderLibrary();
  });

  router.route('/artist/:name', async (params) => {
    const { renderArtist } = await import('../components/detail-view.js');
    renderArtist(params.name);
  });

  router.route('/album/:name', async (params) => {
    const { renderAlbum } = await import('../components/detail-view.js');
    renderAlbum(params.name);
  });

  router.route('/explore', async () => {
    const { renderExplore } = await import('../components/explore-view.js');
    renderExplore();
  });

  router.route('/explore/:id', async () => {
    const { renderExplore } = await import('../components/explore-view.js');
    renderExplore();
  });

  router.route('/genres', async () => {
    const { renderGenres } = await import('../components/genre-view.js');
    renderGenres();
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      import('../components/search-modal.js').then(m => {
        if (m.isOpen()) m.closeSearch(); else m.openSearch();
      });
      return;
    }

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      player.toggle();
    }
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      store.next();
    }
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      store.prev();
    }
    if (e.code === 'KeyM') {
      player.toggleMute();
    }
    if (e.code === 'KeyS') {
      store.setState('shuffle', !store.get('shuffle'));
      import('../components/toast.js').then(m => m.showToast(`Shuffle: ${store.get('shuffle') ? 'on' : 'off'}`));
    }
    if (e.code === 'KeyR') {
      const modes = ['off', 'all', 'one'];
      const current = store.get('repeat');
      const next = modes[(modes.indexOf(current) + 1) % modes.length];
      store.setState('repeat', next);
      import('../components/toast.js').then(m => m.showToast(`Repeat: ${next}`));
    }
    if (e.code === 'ArrowUp') {
      e.preventDefault();
      player.setVolume(Math.min(1, store.get('volume') + 0.05));
    }
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      player.setVolume(Math.max(0, store.get('volume') - 0.05));
    }
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      const speed = Math.min(2, store.get('playbackSpeed') + 0.25);
      player.setPlaybackSpeed(speed);
      import('../components/toast.js').then(m => m.showToast(`Speed: ${speed}x`));
    }
    if (e.key === '-') {
      e.preventDefault();
      const speed = Math.max(0.25, store.get('playbackSpeed') - 0.25);
      player.setPlaybackSpeed(speed);
      import('../components/toast.js').then(m => m.showToast(`Speed: ${speed}x`));
    }
    if (e.code === 'KeyJ') {
      e.preventDefault();
      player.seek(Math.max(0, store.get('currentTime') - 10));
    }
    if (e.code === 'KeyL') {
      e.preventDefault();
      const dur = store.get('duration');
      player.seek(Math.min(dur, store.get('currentTime') + 10));
    }
    if (e.code === 'KeyF' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      import('../components/now-playing.js').then(m => m.openNowPlaying());
    }
    if (e.code === 'Slash' && !e.shiftKey) {
      e.preventDefault();
      import('../components/search-modal.js').then(m => m.openSearch());
    }
    if (e.code === 'Slash' && e.shiftKey) {
      e.preventDefault();
      import('../components/shortcuts-help.js').then(m => m.toggleShortcutsHelp());
    }
    if (e.code === 'KeyQ' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      import('../components/shortcuts-help.js').then(m => m.toggleShortcutsHelp());
    }
    if (e.code === 'Digit0') { e.preventDefault(); player.seek(0); }
    if (e.code === 'Digit1') { e.preventDefault(); const d = store.get('duration'); player.seek(d * 0.1); }
    if (e.code === 'Digit2') { e.preventDefault(); const d = store.get('duration'); player.seek(d * 0.2); }
    if (e.code === 'Digit3') { e.preventDefault(); const d = store.get('duration'); player.seek(d * 0.3); }
    if (e.code === 'Digit4') { e.preventDefault(); const d = store.get('duration'); player.seek(d * 0.4); }
    if (e.code === 'Digit5') { e.preventDefault(); const d = store.get('duration'); player.seek(d * 0.5); }
    if (e.code === 'Digit6') { e.preventDefault(); const d = store.get('duration'); player.seek(d * 0.6); }
    if (e.code === 'Digit7') { e.preventDefault(); const d = store.get('duration'); player.seek(d * 0.7); }
    if (e.code === 'Digit8') { e.preventDefault(); const d = store.get('duration'); player.seek(d * 0.8); }
    if (e.code === 'Digit9') { e.preventDefault(); const d = store.get('duration'); player.seek(d * 0.9); }
  });
}

function setupScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? scrollTop / docHeight : 0;
        bar.style.transform = `scaleX(${progress})`;
        ticking = false;
      });
      ticking = true;
    }
  });
}

function setupBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'fixed bottom-24 right-4 z-40 w-10 h-10 rounded-full bg-brand-500 shadow-lg shadow-brand-500/30 flex items-center justify-center opacity-0 translate-y-4 transition-all duration-300 hover:bg-brand-600 focus-ring';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<span class="material-symbols-outlined text-white text-sm">arrow_upward</span>';
  document.body.appendChild(btn);

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', () => {
    const visible = window.scrollY > 400;
    btn.style.opacity = visible ? '1' : '0';
    btn.style.transform = visible ? 'translateY(0)' : 'translateY(16px)';
    btn.style.pointerEvents = visible ? 'auto' : 'none';
  }, { passive: true });
}

function setupServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((reg) => {
        setTimeout(() => { reg.update().catch(() => {}); }, 1000);
      }).catch(() => {});
    });
  }
}

function setupReducedMotion() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mq.matches) {
    document.documentElement.classList.add('reduce-motion');
  }
  mq.addEventListener('change', (e) => {
    document.documentElement.classList.toggle('reduce-motion', e.matches);
  });
}

function setupTouchGestures() {
  if (!isTouchDevice()) return;

  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) {
        const nextBtn = $('.next-btn');
        if (nextBtn) { store.next(); }
      } else {
        const prevBtn = $('.prev-btn');
        if (prevBtn) { store.prev(); }
      }
    }
  }, { passive: true });
}

function setupPullToRefresh() {
  let startY = 0;
  let pulling = false;
  const threshold = 80;
  const maxPull = 120;
  let refreshEl = null;

  function createRefreshIndicator() {
    if (!refreshEl) {
      refreshEl = document.createElement('div');
      refreshEl.className = 'fixed top-0 left-0 right-0 z-[60] flex items-center justify-center h-0 overflow-hidden transition-all duration-300 bg-brand-500/10 backdrop-blur-sm';
      refreshEl.innerHTML = `
        <div class="flex items-center gap-3 text-sm text-white">
          <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Pull to refresh</span>
        </div>`;
      document.body.appendChild(refreshEl);
    }
    return refreshEl;
  }

  document.addEventListener('touchstart', (e) => {
    if (window.scrollY > 0) return;
    if (e.touches.length > 1) return;
    startY = e.touches[0].clientY;
    pulling = false;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (window.scrollY > 0) { startY = 0; return; }
    if (!startY) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 20) {
      pulling = true;
      const el = createRefreshIndicator();
      const pull = Math.min(dy * 0.5, maxPull);
      el.style.height = `${Math.max(0, pull - 20)}px`;
      el.querySelector('span').textContent = pull >= threshold ? 'Release to refresh' : 'Pull to refresh';
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!pulling || !refreshEl) { startY = 0; return; }
    const wasPulling = refreshEl.style.height.replace('px', '') >= threshold - 20;
    refreshEl.style.height = '0px';
    if (wasPulling) {
      refreshEl.querySelector('span').textContent = 'Refreshing...';
      location.reload();
    }
    startY = 0;
    pulling = false;
  }, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
