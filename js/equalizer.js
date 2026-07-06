import { store } from './store.js';
import { APP_CONFIG } from '../config/app.js';

const BANDS = [
  { label: '31Hz',  freq: 31,   type: 'lowshelf' },
  { label: '62Hz',  freq: 62,   type: 'peaking'  },
  { label: '125Hz', freq: 125,  type: 'peaking'  },
  { label: '250Hz', freq: 250,  type: 'peaking'  },
  { label: '500Hz', freq: 500,  type: 'peaking'  },
  { label: '1kHz',  freq: 1000, type: 'peaking'  },
  { label: '2kHz',  freq: 2000, type: 'peaking'  },
  { label: '4kHz',  freq: 4000, type: 'peaking'  },
  { label: '8kHz',  freq: 8000, type: 'peaking'  },
  { label: '16kHz', freq: 16000,type: 'highshelf'}
];

const PRESETS = {
  Normal:        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Classical:     [ 4, 3, 2, 1, 0, 0, 1, 2, 3, 4],
  Dance:         [ 6, 5, 4, 2, 0, 0, -2, -4, 0, 2],
  Rock:          [ 5, 4, 4, 2, 0, -1, -4, -4, 0, 4],
  Jazz:          [ 4, 3, 2, 1, 0, 0, 2, 3, 4, 4],
  Pop:           [-2, 0, 3, 4, 4, 4, 3, 2, 0, -1],
  Voice:         [-2, -1, 0, 4, 5, 5, 4, 2, 2, 2],
  'Bass Boost':  [ 8, 8, 5, 2, -2, -4, -6, -8, -8, -8],
  'Treble Boost':[-8, -8, -6, -4, 0, 2, 4, 6, 8, 8]
};

class EqualizerEngine {
  constructor() {
    this._ctx = null;
    this._filters = [];
    this._analyser = null;
    this._source = null;
    this._sourceCtx = null;
    this._vizSource = null;
    this._running = false;
    this._presets = PRESETS;
    this._initialized = false;

    store.on('change', ({ path }) => {
      if (path === 'eq') this._syncFromStore();
    });
  }

  get presets() { return this._presets; }
  get bands() { return BANDS; }
  get filters() { return this._filters; }
  get analyser() { return this._analyser; }
  get context() { return this._ctx; }

  _ensureContext() {
    if (this._ctx) return this._ctx;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this._ctx;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;
    const ctx = this._ensureContext();

    this._filters = BANDS.map((band, i) => {
      const filter = ctx.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.freq;
      filter.Q.value = 0.707;
      filter.gain.value = store.get('eq').gains[i] || 0;
      return filter;
    });

    this._analyser = ctx.createAnalyser();
    this._analyser.fftSize = 64;

    this._connectFilters(false);
    this._startVizSource();

    this._running = true;
  }

  _startVizSource() {
    if (this._vizSource) {
      try { this._vizSource.stop(); } catch {}
      this._vizSource.disconnect();
    }
    const ctx = this._ensureContext();
    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this._vizSource = ctx.createBufferSource();
    this._vizSource.buffer = buffer;
    this._vizSource.loop = true;
    const bypassed = store.get('eq').bypassed;
    if (bypassed) {
      this._vizSource.connect(this._analyser);
    } else if (this._filters.length) {
      this._vizSource.connect(this._filters[0]);
    }
    this._vizSource.start();
  }

  _connectFilters(connectDest = false) {
    if (this._filters.length < 2) return;
    for (let i = 1; i < this._filters.length; i++) {
      this._filters[i - 1].connect(this._filters[i]);
    }
    this._filters[this._filters.length - 1].connect(this._analyser);
    if (connectDest && this._ctx) {
      this._filters[this._filters.length - 1].connect(this._ctx.destination);
    }
  }

  connectSource(sourceNode, audioCtx) {
    this._source = sourceNode;
    this._sourceCtx = audioCtx;
    const bypassed = store.get('eq').bypassed;
    if (bypassed) {
      this._disconnectVizSource();
      sourceNode.connect(this._analyser);
      if (audioCtx) sourceNode.connect(audioCtx.destination);
    } else if (this._filters.length) {
      this._disconnectVizSource();
      sourceNode.connect(this._filters[0]);
      if (this._ctx && audioCtx) this._filters[this._filters.length - 1].connect(audioCtx.destination);
    }
  }

  disconnectSource() {
    if (this._sourceCtx) {
      this._sourceCtx = null;
    }
    if (this._source) {
      try { this._source.disconnect(); } catch {}
      this._source = null;
    }
    this._restoreVizRouting();
  }

  _disconnectVizSource() {
    if (this._vizSource) {
      try { this._vizSource.stop(); } catch {}
      this._vizSource.disconnect();
      this._vizSource = null;
    }
  }

  _restoreVizRouting() {
    this._filters.forEach(f => {
      try { f.disconnect(); } catch {}
    });
    try { this._analyser.disconnect(); } catch {}
    this._connectFilters(false);
    this._startVizSource();
  }

  setBandGain(index, value) {
    const gains = [...store.get('eq').gains];
    gains[index] = Math.max(-12, Math.min(12, value));
    store.setState('eq', { ...store.get('eq'), gains, preset: 'Custom' });
    if (this._filters[index]) {
      this._filters[index].gain.value = gains[index];
    }
  }

  persistEq() {
    try {
      const prefs = JSON.parse(localStorage.getItem(APP_CONFIG.storage.keys.preferences) || '{}');
      prefs.eq = store.get('eq');
      localStorage.setItem(APP_CONFIG.storage.keys.preferences, JSON.stringify(prefs));
    } catch {}
  }

  applyPreset(name) {
    const gains = this._presets[name];
    if (!gains) return;
    store.setState('eq', { ...store.get('eq'), gains: [...gains], preset: name });
    this._filters.forEach((f, i) => {
      f.gain.value = gains[i];
    });
    this.persistEq();
  }

  toggleBypass() {
    const bypassed = !store.get('eq').bypassed;
    store.setState('eq', { ...store.get('eq'), bypassed });
    this.persistEq();
    if (!this._ctx) return;
    this._rebuildRouting();
  }

  _rebuildRouting() {
    const bypassed = store.get('eq').bypassed;
    this._filters.forEach(f => f.disconnect());
    this._analyser.disconnect();
    if (this._ctx) {
      try { this._ctx.destination && this._filters.forEach(f => f.disconnect(this._ctx.destination)); } catch {}
    }
    this._connectFilters(true);
    if (this._vizSource) {
      try { this._vizSource.stop(); } catch {}
      this._vizSource.disconnect();
      this._startVizSource();
    }
    if (this._source) {
      this._source.disconnect();
      if (bypassed) {
        this._source.connect(this._analyser);
        if (this._sourceCtx) this._source.connect(this._sourceCtx.destination);
      } else if (this._filters.length) {
        this._source.connect(this._filters[0]);
        if (this._sourceCtx) this._filters[this._filters.length - 1].connect(this._sourceCtx.destination);
      }
    }
  }

  _syncFromStore() {
    const eq = store.get('eq');
    this._filters.forEach((f, i) => {
      f.gain.value = eq.gains[i] || 0;
    });
  }

  getFrequencyData() {
    if (!this._analyser || !this._running) return null;
    const data = new Uint8Array(this._analyser.frequencyBinCount);
    this._analyser.getByteFrequencyData(data);
    return data;
  }

  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  destroy() {
    if (this._vizSource) {
      try { this._vizSource.stop(); } catch {}
      this._vizSource.disconnect();
      this._vizSource = null;
    }
    if (this._ctx) {
      this._ctx.close();
      this._ctx = null;
    }
    this._filters = [];
    this._analyser = null;
    this._source = null;
    this._running = false;
    this._initialized = false;
  }
}

export const eqEngine = new EqualizerEngine();
export { BANDS, PRESETS };
