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
    </div>
  `);
}

