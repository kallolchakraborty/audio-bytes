export function $(sel, ctx = document) {
  return ctx.querySelector(sel);
}

export function $$(sel, ctx = document) {
  return [...ctx.querySelectorAll(sel)];
}

export function create(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v);
  }
  el.append(...children.filter(Boolean));
  return el;
}

export function html(strings, ...vals) {
  const template = document.createElement('template');
  template.innerHTML = strings.reduce((acc, str, i) => acc + str + (vals[i] !== undefined ? String(vals[i] ?? '') : ''), '');
  return template.content;
}

export function frag(...nodes) {
  const f = document.createDocumentFragment();
  f.append(...nodes.filter(Boolean));
  return f;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function debounce(fn, ms = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function throttle(fn, ms = 100) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

export function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getYouTubeID(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function getYouTubeThumbnail(id, quality = 'hqdefault') {
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function classnames(...args) {
  return args.flat().filter(Boolean).join(' ');
}

export function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function safeJSON(str, fallback = null) {
  try { return JSON.parse(str); } catch { return fallback; }
}
