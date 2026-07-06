import { $, html } from '../js/utils.js';
import { render } from '../js/ui.js';

export function renderPlaylistSkeleton(container) {
  render(container, html`
    <div class="flex flex-col sm:flex-row items-start gap-6 animate-pulse">
      <div class="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl skeleton-pulse"></div>
      <div class="flex-1 pt-2">
        <div class="h-3 w-16 skeleton-pulse rounded mb-3"></div>
        <div class="h-8 w-64 skeleton-pulse rounded mb-3"></div>
        <div class="h-4 w-48 skeleton-pulse rounded mb-4"></div>
        <div class="h-4 w-32 skeleton-pulse rounded mb-5"></div>
        <div class="flex gap-3">
          <div class="h-10 w-28 skeleton-pulse rounded-full"></div>
          <div class="h-10 w-24 skeleton-pulse rounded-full"></div>
        </div>
      </div>
    </div>
  `);
}

export function renderSongGridSkeleton(container, count = 10) {
  const cards = Array.from({ length: Math.min(count, 10) }, () => `
    <div class="rounded-xl overflow-hidden animate-pulse">
      <div class="aspect-square skeleton-pulse"></div>
      <div class="p-3 space-y-2">
        <div class="h-4 w-3/4 skeleton-pulse rounded"></div>
        <div class="h-3 w-1/2 skeleton-pulse rounded"></div>
        <div class="h-3 w-1/3 skeleton-pulse rounded"></div>
      </div>
    </div>
  `).join('');

  render(container, html`
    <div class="song-grid">${cards}</div>
  `);
}

export function renderHomeSkeleton(container) {
  render(container, html`
    <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 animate-pulse">
      <div class="flex flex-col items-center gap-4 mb-12">
        <div class="w-20 h-20 skeleton-pulse rounded-full mb-4"></div>
        <div class="h-10 w-96 skeleton-pulse rounded mb-2"></div>
        <div class="h-5 w-64 skeleton-pulse rounded mb-4"></div>
        <div class="h-12 w-40 skeleton-pulse rounded-full"></div>
      </div>
      <div class="space-y-4">
        <div class="h-6 w-40 skeleton-pulse rounded"></div>
        <div class="playlist-grid">
          ${Array.from({ length: 4 }, () => `
            <div class="rounded-xl overflow-hidden">
              <div class="aspect-video skeleton-pulse"></div>
              <div class="p-3 space-y-2">
                <div class="h-4 w-3/4 skeleton-pulse rounded"></div>
                <div class="h-3 w-1/2 skeleton-pulse rounded"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `);
}
