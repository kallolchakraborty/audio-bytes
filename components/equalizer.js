import { $ } from '../js/utils.js';
import { store } from '../js/store.js';
import { eqEngine } from '../js/equalizer.js';

function mapBinsToBars(bins, barCount) {
  const result = new Array(barCount).fill(0);
  const binsPerBar = bins.length / barCount;
  for (let i = 0; i < barCount; i++) {
    const start = Math.floor(i * binsPerBar);
    const end = Math.floor((i + 1) * binsPerBar);
    let sum = 0;
    for (let j = start; j < end && j < bins.length; j++) {
      sum += bins[j];
    }
    result[i] = sum / (end - start);
  }
  return result;
}

export function initEqualizer() {
  const container = $('#player-bar');
  if (!container) return;

  const existing = container.querySelector('.equalizer-container');
  if (existing) return;

  eqEngine.init();

  const eqContainer = document.createElement('div');
  eqContainer.className = 'flex items-end gap-[1px] h-3 equalizer-container';
  eqContainer.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < 10; i++) {
    const bar = document.createElement('div');
    bar.className = 'equalizer-bar';
    eqContainer.appendChild(bar);
  }

  const titleEl = $('#player-title');
  if (titleEl) {
    const titleRow = titleEl.closest('.flex');
    if (titleRow) {
      titleRow.appendChild(eqContainer);
    }
  }

  let rafId = null;

  function tick() {
    const data = eqEngine.getFrequencyData();
    if (data) {
      const bars = container.querySelectorAll('.equalizer-bar');
      const barValues = mapBinsToBars(data, bars.length);
      bars.forEach((bar, i) => {
        const normalized = barValues[i] / 255;
        const scale = 0.2 + normalized * 0.8;
        bar.style.transform = `scaleY(${scale})`;
      });
    }
    if (store.get('isPlaying')) {
      rafId = requestAnimationFrame(tick);
    }
  }

  store.on('change', ({ path }) => {
    if (path === 'isPlaying') {
      if (store.get('isPlaying')) {
        eqEngine.resume();
        rafId = requestAnimationFrame(tick);
      } else if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
        const bars = container.querySelectorAll('.equalizer-bar');
        bars.forEach(bar => { bar.style.transform = 'scaleY(0.2)'; });
      }
    }
    if (path === 'eq') {
      const eq = store.get('eq');
      const bars = container.querySelectorAll('.equalizer-bar');
      bars.forEach((bar, i) => {
        const bandGain = i < eq.gains.length ? eq.gains[i] : 0;
        const scale = 1 + (bandGain / 12) * 0.6;
        bar.style.setProperty('--eq-intensity', Math.max(0.3, scale));
      });
    }
  });
}
