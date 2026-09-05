import { $, $$, create, html } from './utils.js';

export function render(container, content) {
  if (!container) return;
  if (typeof content === 'string') {
    container.innerHTML = content;
  } else if (content instanceof DocumentFragment) {
    container.innerHTML = '';
    container.appendChild(content);
  } else if (content instanceof HTMLElement) {
    container.innerHTML = '';
    container.appendChild(content);
  }
}

export function show(element) {
  if (!element) return;
  element.classList.remove('hidden');
}

export function hide(element) {
  if (!element) return;
  element.classList.add('hidden');
}

export function toggle(element) {
  if (!element) return;
  element.classList.toggle('hidden');
}

export function observeVisibility(el, callback) {
  if (!window.IntersectionObserver) {
    callback(true);
    return () => {};
  }
  const observer = new IntersectionObserver(([entry]) => {
    callback(entry.isIntersecting);
  }, { threshold: 0.1 });
  observer.observe(el);
  return () => observer.disconnect();
}

export function animateEntrance(container, selector = '.animate-in', stagger = 50) {
  const items = $$(selector, container);
  items.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), i * stagger);
  });
}

export function staggerOnView(container, selector = '.animate-in', stagger = 60) {
  if (!container || !window.IntersectionObserver) {
    animateEntrance(container, selector, stagger);
    return () => {};
  }
  let activated = false;
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !activated) {
      activated = true;
      animateEntrance(container, selector, stagger);
      observer.disconnect();
    }
  }, { threshold: 0.1 });
  observer.observe(container);
  return () => observer.disconnect();
}

export function createRipple(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const ripple = create('span', {
    style: {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      left: `${x}px`,
      top: `${y}px`,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.15)',
      transform: 'scale(0)',
      animation: 'ripple 0.6s ease-out',
      pointerEvents: 'none'
    }
  });
  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

export function trapFocus(element) {
  const focusable = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const handler = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };
  element.addEventListener('keydown', handler);
  return () => element.removeEventListener('keydown', handler);
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function setPageTitle(title) {
  document.title = title ? `${title} — AudioBytes` : 'AudioBytes — Your music, beautifully organized.';
}

export function loadingState(container) {
  render(container, html`
    <div class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm text-slate-500">Loading...</span>
      </div>
    </div>
  `);
}

export function errorState(container, message, onRetry) {
  render(container, html`
    <div class="flex flex-col items-center justify-center py-20 gap-4">
      <span class="material-symbols-outlined text-4xl text-slate-600">error_outline</span>
      <p class="text-slate-400 text-sm">${message}</p>
      <button class="btn-primary text-sm retry-btn">
        <span class="material-symbols-outlined text-sm">refresh</span>
        Try Again
      </button>
    </div>
  `);
  const btn = $('.retry-btn', container);
  if (btn && onRetry) btn.addEventListener('click', onRetry);
}

export function emptyState(container, { icon = 'music_note', title = 'Nothing here', subtitle = '' } = {}) {
  render(container, html`
    <div class="empty-state">
      <span class="material-symbols-outlined text-5xl text-slate-600 mb-4">${icon}</span>
      <h3 class="text-lg font-semibold text-slate-400 mb-1">${title}</h3>
      ${subtitle ? `<p class="text-sm text-slate-500">${subtitle}</p>` : ''}
    </div>
  `);
}
