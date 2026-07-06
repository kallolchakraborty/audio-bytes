import { $, html } from './utils.js';
import { store } from './store.js';
import { render, setPageTitle } from './ui.js';

class Router {
  constructor() {
    this._routes = new Map();
    this._currentRoute = null;
    window.addEventListener('hashchange', () => this._handleRoute());
  }

  route(pattern, handler) {
    this._routes.set(pattern, handler);
    return this;
  }

  navigate(path) {
    window.location.hash = path;
  }

  start() {
    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      this._handleRoute();
    }
  }

  _handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const matched = this._match(hash);
    if (matched) {
      this._currentRoute = matched;
      store.setState('error', null);
      matched.handler(matched.params);
    } else if (hash !== '/') {
      const container = $('#page-view');
      setPageTitle('Not Found');
      if (container) {
        render(container, html`
          <div class="flex flex-col items-center justify-center py-20 gap-4">
            <span class="material-symbols-outlined text-5xl text-slate-600">search_off</span>
            <h1 class="text-2xl font-bold text-white">Page not found</h1>
            <p class="text-slate-400 text-sm">The page you're looking for doesn't exist.</p>
            <a href="#/" class="btn-primary mt-2">
              <span class="material-symbols-outlined text-sm">home</span>
              Go Home
            </a>
          </div>
        `);
      }
    }
  }

  _match(hash) {
    for (const [pattern, handler] of this._routes) {
      const params = this._patternMatch(pattern, hash);
      if (params !== null) {
        return { handler, params };
      }
    }
    return null;
  }

  _patternMatch(pattern, hash) {
    const patternParts = pattern.split('/');
    const hashParts = hash.split('/');
    if (patternParts.length !== hashParts.length) return null;
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = decodeURIComponent(hashParts[i]);
      } else if (patternParts[i] !== hashParts[i]) {
        return null;
      }
    }
    return params;
  }

  getCurrentRoute() {
    return this._currentRoute;
  }
}

export const router = new Router();
