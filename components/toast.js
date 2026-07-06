import { $, html } from '../js/utils.js';
import { render } from '../js/ui.js';

export function showToast(message, type = 'info', duration = 3000) {
  const container = $('#toast-container');
  if (!container) return;

  const iconMap = {
    info: 'info',
    success: 'check_circle',
    error: 'error',
    warning: 'warning'
  };

  const borderMap = {
    info: 'border-l-brand-500',
    success: 'border-l-emerald-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500'
  };

  const iconColorMap = {
    info: 'text-brand-500',
    success: 'text-emerald-500',
    error: 'text-red-500',
    warning: 'text-amber-500'
  };

  const toast = document.createElement('div');
  toast.className = `toast flex items-center gap-3 px-4 py-3 rounded-xl border border-white/5 bg-surface-elevated shadow-xl border-l-2 ${borderMap[type] || borderMap.info} pointer-events-auto`;
  toast.setAttribute('role', 'alert');

  toast.innerHTML = `
    <span class="material-symbols-outlined text-sm ${iconColorMap[type] || 'text-brand-500'}">${iconMap[type] || 'info'}</span>
    <p class="text-sm text-slate-300 flex-1">${message}</p>
    <button class="text-slate-500 hover:text-white transition-colors toast-close" aria-label="Dismiss">
      <span class="material-symbols-outlined text-sm">close</span>
    </button>
  `;

  container.appendChild(toast);

  toast.querySelector('.toast-close')?.addEventListener('click', () => dismiss(toast));

  setTimeout(() => dismiss(toast), duration);
}

function dismiss(toast) {
  if (!toast || toast.classList.contains('exit')) return;
  toast.classList.add('exit');
  setTimeout(() => toast.remove(), 200);
}
