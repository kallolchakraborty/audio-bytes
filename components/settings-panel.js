import { $, formatTime } from '../js/utils.js';
import { store } from '../js/store.js';
import { trapFocus } from '../js/ui.js';
import { player } from '../js/player.js';

let _open = false;
let _lastFocus = null;
let _cleanupTrap = null;
let _onKeyDown = null;
let _sleepTimerId = null;
let _sleepEndTime = null;
let _sleepTickId = null;

export function toggleSettings() {
  if (_open) closeSettings();
  else openSettings();
}

export function openSettings() {
  if (_open) return;
  _open = true;
  _lastFocus = document.activeElement;
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.setAttribute('aria-hidden', 'true'));
  let panel = $('#settings-panel');
  if (panel) { panel.classList.remove('hidden'); }
  else { panel = createPanel(); }
  renderContent();
  setTimeout(() => panel.classList.add('open'), 10);
  _cleanupTrap = trapFocus(panel);
  _onKeyDown = (e) => { if (e.key === 'Escape') closeSettings(); };
  document.addEventListener('keydown', _onKeyDown);
}

export function closeSettings() {
  if (!_open) return;
  _open = false;
  const panel = $('#settings-panel');
  if (panel) {
    panel.classList.remove('open');
    setTimeout(() => panel.classList.add('hidden'), 300);
  }
  if (_onKeyDown) { document.removeEventListener('keydown', _onKeyDown); _onKeyDown = null; }
  if (_cleanupTrap) { _cleanupTrap(); _cleanupTrap = null; }
  if (_lastFocus) { _lastFocus.focus(); _lastFocus = null; }
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.removeAttribute('aria-hidden'));
}

function createPanel() {
  const panel = document.createElement('div');
  panel.id = 'settings-panel';
  panel.className = 'fixed inset-0 z-50 pointer-events-none hidden';
  panel.innerHTML = `
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm settings-backdrop pointer-events-auto"></div>
    <div class="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-surface-elevated border-l border-white/10 shadow-2xl settings-drawer pointer-events-auto flex flex-col" role="dialog" aria-modal="true" aria-labelledby="settings-heading">
      <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 class="text-sm font-semibold text-white" id="settings-heading">Settings</h3>
        <button class="settings-close btn-icon w-7 h-7" aria-label="Close settings">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <div id="settings-content" class="flex-1 overflow-y-auto px-4 py-4 space-y-5"></div>
    </div>
  `;
  document.body.appendChild(panel);

  panel.addEventListener('click', (e) => {
    if (e.target.closest('.settings-backdrop') || e.target.closest('.settings-close')) {
      closeSettings();
      return;
    }
    const speedBtn = e.target.closest('.speed-up');
    if (speedBtn) {
      setSpeed(Math.min(2, store.get('playbackSpeed') + 0.25));
      return;
    }
    const speedDown = e.target.closest('.speed-down');
    if (speedDown) {
      setSpeed(Math.max(0.25, store.get('playbackSpeed') - 0.25));
      return;
    }
    const preset = e.target.closest('.speed-preset');
    if (preset) {
      setSpeed(parseFloat(preset.dataset.speed));
      return;
    }
    const sleepPreset = e.target.closest('.sleep-preset');
    if (sleepPreset) {
      const minutes = sleepPreset.dataset.minutes;
      const end = sleepPreset.dataset.end;
      if (minutes) startSleepTimer(parseInt(minutes) * 60 * 1000);
      else if (end === 'song') startSleepEndOfSong();
      else if (end === 'playlist') startSleepEndOfPlaylist();
      return;
    }
    const sleepCancel = e.target.closest('.sleep-cancel-btn');
    if (sleepCancel) {
      cancelSleepTimer();
    }
  });

  return panel;
}

function renderContent() {
  const container = $('#settings-content');
  if (!container) return;

  const speed = store.get('playbackSpeed');

  container.innerHTML = `
    <div>
      <label class="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-3">Playback</label>
      <div class="bg-white/5 rounded-xl p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-white">Playback Speed</span>
          <div class="flex items-center gap-2">
            <button class="speed-down btn-icon w-7 h-7 text-slate-400 hover:text-white text-sm" aria-label="Decrease speed">−</button>
            <span class="text-sm text-white font-medium w-10 text-center tabular-nums" id="settings-speed">${speed}x</span>
            <button class="speed-up btn-icon w-7 h-7 text-slate-400 hover:text-white text-sm" aria-label="Increase speed">+</button>
          </div>
        </div>
        <div class="flex gap-1">
          ${[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => `
            <button class="speed-preset text-xs px-2 py-1 rounded ${s === speed ? 'bg-brand text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'} transition-all flex-1" data-speed="${s}">${s}x</button>
          `).join('')}
        </div>
      </div>
    </div>

    <div>
      <label class="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-3">Sleep Timer</label>
      <div class="bg-white/5 rounded-xl p-4">
        ${_sleepTimerId ? `
          <div class="text-center">
            <p class="text-sm text-white mb-1">Timer active</p>
            <p class="text-lg font-bold text-brand" id="sleep-countdown">${formatTime(Math.max(0, Math.floor((_sleepEndTime - Date.now()) / 1000)))}</p>
            <button class="sleep-cancel-btn text-xs text-slate-400 hover:text-white mt-2 px-3 py-1 rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
          </div>
        ` : `
          <div class="flex flex-wrap gap-2">
            ${[15, 30, 45, 60].map(m => `
              <button class="sleep-preset text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand hover:text-white text-slate-300 transition-all" data-minutes="${m}">${m} min</button>
            `).join('')}
            <button class="sleep-preset text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand hover:text-white text-slate-300 transition-all" data-end="song">End of song</button>
            <button class="sleep-preset text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-brand hover:text-white text-slate-300 transition-all" data-end="playlist">End of playlist</button>
          </div>
        `}
      </div>
    </div>

    <div>
      <label class="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-3">About</label>
      <div class="bg-white/5 rounded-xl p-4 space-y-1 text-sm text-slate-400">
        <p>AudioBytes v1.0.0</p>
        <p>A modern music streaming PWA.</p>
      </div>
    </div>
  `;
}

function setSpeed(speed) {
  if (player?.setPlaybackSpeed) player.setPlaybackSpeed(speed);
  store.setState('playbackSpeed', speed);
  const label = $('#settings-speed');
  if (label) label.textContent = `${speed}x`;
  document.querySelectorAll('.speed-preset').forEach(b => {
    const val = parseFloat(b.dataset.speed);
    b.className = `text-xs px-2 py-1 rounded transition-all flex-1 ${val === speed ? 'bg-brand text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`;
  });
}

function startSleepTimer(durationMs) {
  cancelSleepTimer();
  _sleepEndTime = Date.now() + durationMs;
  _sleepTimerId = setTimeout(() => {
    player.pause();
    store.setState('isPlaying', false);
    import('./toast.js').then(m => m.showToast('Sleep timer ended', 'success'));
    cancelSleepTimer();
  }, durationMs);
  _sleepTickId = setInterval(() => {
    const label = $('#sleep-countdown');
    if (label) {
      const remaining = Math.max(0, Math.floor((_sleepEndTime - Date.now()) / 1000));
      label.textContent = formatTime(remaining);
    }
  }, 1000);
  renderContent();
  import('./toast.js').then(m => m.showToast(`Sleep timer set for ${Math.round(durationMs / 60000)} min`));
}

function startSleepEndOfSong() {
  cancelSleepTimer();
  _sleepTimerId = store.on('songEnded', function handler() {
    player.pause();
    import('./toast.js').then(m => m.showToast('Sleep timer ended (end of song)', 'success'));
    store.off('songEnded', handler);
    cancelSleepTimer();
  });
  renderContent();
  import('./toast.js').then(m => m.showToast('Sleep timer: end of song'));
}

function startSleepEndOfPlaylist() {
  cancelSleepTimer();
  _sleepTimerId = store.on('songEnded', function handler() {
    const qi = store.get('queueIndex');
    const q = store.get('queue');
    if (q.length > 0 && qi >= q.length - 1) {
      player.pause();
      import('./toast.js').then(m => m.showToast('Sleep timer ended (end of playlist)', 'success'));
      store.off('songEnded', handler);
      cancelSleepTimer();
    }
  });
  renderContent();
  import('./toast.js').then(m => m.showToast('Sleep timer: end of playlist'));
}

function cancelSleepTimer() {
  if (_sleepTimerId && typeof _sleepTimerId === 'function') _sleepTimerId();
  else if (_sleepTimerId) clearTimeout(_sleepTimerId);
  _sleepTimerId = null;
  if (_sleepTickId) { clearInterval(_sleepTickId); _sleepTickId = null; }
  _sleepEndTime = null;
  const container = $('#settings-content');
  if (container) renderContent();
}
