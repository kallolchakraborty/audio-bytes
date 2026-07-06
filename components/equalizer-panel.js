import { $, html } from '../js/utils.js';
import { store } from '../js/store.js';
import { eqEngine, BANDS, PRESETS } from '../js/equalizer.js';
import { trapFocus } from '../js/ui.js';

export function initEqualizerPanel() {
  let panelEl = $('#eq-panel');
  if (panelEl) return;

  const eq = store.get('eq');
  const presetNames = Object.keys(PRESETS);

  const fragment = html`
    <div id="eq-panel" class="eq-panel" role="dialog" aria-modal="true" aria-labelledby="eq-heading" aria-hidden="true">
      <div class="eq-backdrop"></div>
      <div class="eq-drawer">
        <div class="eq-header">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-brand-500 text-lg">graphic_eq</span>
            <h3 class="text-sm font-semibold text-white" id="eq-heading">Equalizer</h3>
            ${eq.bypassed ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium">BYPASSED</span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <button class="eq-toggle-btn btn-icon w-7 h-7 ${eq.bypassed ? '' : 'active'}" aria-label="Toggle equalizer" title="Toggle EQ">
              <span class="material-symbols-outlined text-sm">${eq.bypassed ? 'tune' : 'graphic_eq'}</span>
            </button>
            <button class="eq-close-btn btn-icon w-7 h-7" aria-label="Close equalizer" title="Close">
              <span class="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>

        <div class="eq-presets">
          <div class="eq-presets-scroll">
            ${presetNames.map(name =>
              `<button class="eq-preset-btn ${eq.preset === name ? 'active' : ''}" data-preset="${name}">${name}</button>`
            ).join('')}
          </div>
        </div>

        <div class="eq-bands">
          <div class="eq-bands-scroll">
            ${BANDS.map((band, i) => `
              <div class="eq-band">
                <span class="eq-db-label" id="eq-db-${i}">${eq.gains[i] > 0 ? '+' : ''}${eq.gains[i]}dB</span>
                <div class="eq-slider-wrap">
                  <input type="range" min="-12" max="12" step="1" value="${eq.gains[i]}"
                         class="eq-slider" data-band="${i}" aria-label="${band.label} ${band.type}">
                  <div class="eq-slider-center"></div>
                </div>
                <span class="eq-freq-label">${band.label}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(fragment);
  panelEl = $('#eq-panel');

  bindEqEvents(panelEl);

  store.on('change', ({ path }) => {
    if (path === 'eq') updateEqUI();
  });
}

let _onKeyDown = null;
let _lastFocus = null;
let _cleanupTrap = null;

function bindEqEvents(panel) {
  const backdrop = panel.querySelector('.eq-backdrop');
  const closeBtn = panel.querySelector('.eq-close-btn');
  const toggleBtn = panel.querySelector('.eq-toggle-btn');

  backdrop.addEventListener('click', closeEqPanel);
  closeBtn.addEventListener('click', closeEqPanel);

  toggleBtn.addEventListener('click', () => {
    eqEngine.toggleBypass();
  });

  panel.querySelectorAll('.eq-slider').forEach(slider => {
    slider.addEventListener('input', () => {
      const band = parseInt(slider.dataset.band);
      const val = parseFloat(slider.value);
      eqEngine.setBandGain(band, val);
    });

    slider.addEventListener('change', () => {
      eqEngine.persistEq();
    });
  });

  panel.querySelectorAll('.eq-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.preset;
      eqEngine.applyPreset(name);
    });
  });
}

function updateEqUI() {
  const eq = store.get('eq');
  const panel = $('#eq-panel');
  if (!panel) return;

  const toggleBtn = panel.querySelector('.eq-toggle-btn');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', !eq.bypassed);
    const icon = toggleBtn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = eq.bypassed ? 'tune' : 'graphic_eq';
  }

  const badge = panel.querySelector('.eq-header .text-red-400');
  if (eq.bypassed && !badge) {
    const header = panel.querySelector('.eq-header .flex:first-child');
    if (header) {
      const el = document.createElement('span');
      el.className = 'text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-medium';
      el.textContent = 'BYPASSED';
      header.appendChild(el);
    }
  } else if (!eq.bypassed && badge) {
    badge.remove();
  }

  panel.querySelectorAll('.eq-slider').forEach(slider => {
    const band = parseInt(slider.dataset.band);
    slider.value = eq.gains[band];
    const dbLabel = document.getElementById(`eq-db-${band}`);
    if (dbLabel) {
      dbLabel.textContent = `${eq.gains[band] > 0 ? '+' : ''}${eq.gains[band]}dB`;
    }
  });

  panel.querySelectorAll('.eq-preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === eq.preset);
  });
}

export function openEqPanel() {
  const panel = $('#eq-panel');
  if (!panel) return;
  eqEngine.init();
  eqEngine.resume();
  _lastFocus = document.activeElement;
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.setAttribute('aria-hidden', 'true'));
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  _cleanupTrap = trapFocus(panel);
  _onKeyDown = (e) => { if (e.key === 'Escape') closeEqPanel(); };
  document.addEventListener('keydown', _onKeyDown);
}

export function closeEqPanel() {
  const panel = $('#eq-panel');
  if (!panel) return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  if (_cleanupTrap) { _cleanupTrap(); _cleanupTrap = null; }
  if (_onKeyDown) {
    document.removeEventListener('keydown', _onKeyDown);
    _onKeyDown = null;
  }
  if (_lastFocus) { _lastFocus.focus(); _lastFocus = null; }
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.removeAttribute('aria-hidden'));
}

export function toggleEqPanel() {
  const panel = $('#eq-panel');
  if (!panel) return;
  if (panel.classList.contains('open')) {
    closeEqPanel();
  } else {
    openEqPanel();
  }
}
