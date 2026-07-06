import { $ } from '../js/utils.js';
import { trapFocus } from '../js/ui.js';

let _open = false;
let _cleanup = null;
let _lastFocus = null;

const SHORTCUTS = [
  { key: 'Space', desc: 'Play / Pause' },
  { key: '←', desc: 'Previous track' },
  { key: '→', desc: 'Next track' },
  { key: '↑', desc: 'Volume up' },
  { key: '↓', desc: 'Volume down' },
  { key: 'J', desc: 'Seek back 10s' },
  { key: 'L', desc: 'Seek forward 10s' },
  { key: '0-9', desc: 'Seek to 0%-90%' },
  { key: 'M', desc: 'Mute / Unmute' },
  { key: 'S', desc: 'Toggle shuffle' },
  { key: 'R', desc: 'Cycle repeat mode' },
  { key: 'F', desc: 'Full-screen Now Playing' },
  { key: '+ / -', desc: 'Increase / Decrease speed' },
  { key: 'Ctrl+K', desc: 'Search' },
  { key: '/', desc: 'Search' },
  { key: 'Escape', desc: 'Close modals / overlays' },
];

export function toggleShortcutsHelp() {
  if (_open) closeShortcutsHelp();
  else openShortcutsHelp();
}

export function openShortcutsHelp() {
  if (_open) return;
  _open = true;
  _lastFocus = document.activeElement;
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.setAttribute('aria-hidden', 'true'));
  let overlay = $('#shortcuts-help');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'shortcuts-help';
    document.body.appendChild(overlay);
  }
  overlay.className = 'fixed inset-0 z-[70] flex items-center justify-center';
  overlay.innerHTML = `
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" id="sh-backdrop"></div>
    <div class="relative z-10 bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4 p-6 animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="shortcuts-heading">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold text-white" id="shortcuts-heading">Keyboard Shortcuts</h2>
        <button class="sh-close btn-icon w-7 h-7 text-slate-400 hover:text-white" aria-label="Close shortcuts help">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
      <div class="space-y-1">
        ${SHORTCUTS.map(s => `
          <div class="flex items-center justify-between py-1.5">
            <span class="text-sm text-slate-400">${s.desc}</span>
            <kbd class="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono min-w-[48px] text-center">${s.key}</kbd>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  _cleanup = trapFocus(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target.closest('#sh-backdrop') || e.target.closest('.sh-close')) closeShortcutsHelp();
  });
  document.addEventListener('keydown', _onKeyDown);
}

function _onKeyDown(e) {
  if (e.key === 'Escape') closeShortcutsHelp();
}

export function closeShortcutsHelp() {
  if (!_open) return;
  _open = false;
  const overlay = $('#shortcuts-help');
  if (overlay) overlay.remove();
  if (_cleanup) { _cleanup(); _cleanup = null; }
  document.removeEventListener('keydown', _onKeyDown);
  if (_lastFocus) { _lastFocus.focus(); _lastFocus = null; }
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.removeAttribute('aria-hidden'));
}
