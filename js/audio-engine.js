import { store } from './store.js';
import { eqEngine } from './equalizer.js';

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.smnz.de',
  'https://pipedapi.adminforge.de'
];

const EQ_STORAGE_KEY = 'audio-bytes-eq-mode';

class AudioEngine {
  constructor() {
    this._audio = null;
    this._sourceNode = null;
    this._ctx = null;
    this._streamUrl = null;
    this._ready = false;
    this._loading = false;
    this._loadPromise = null;
    this._progressInterval = null;
    this._endedHandler = null;
    this._mode = null;
    this._lastVolume = 1;
    this._triedInstances = [];
  }

  get isEqSupported() {
    return this._mode === 'eq';
  }

  get isActive() {
    return this._mode !== null;
  }

  async init() {
    if (this._mode) return;
    const url = await this._fetchStreamUrl();
    if (!url) {
      this._mode = 'youtube';
      return;
    }
    this._setupAudio(url);
    this._mode = 'eq';
  }

  async _fetchStreamUrl() {
    const song = store.get('currentSong');
    if (!song || !song.youtube_id) return null;
    const instances = PIPED_INSTANCES.filter(i => !this._triedInstances.includes(i));
    if (!instances.length) return null;
    for (const instance of instances) {
      try {
        const res = await fetch(`${instance}/streams/${song.youtube_id}`, {
          signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) { this._triedInstances.push(instance); continue; }
        const data = await res.json();
        if (!data.audioStreams || !data.audioStreams.length) {
          this._triedInstances.push(instance); continue;
        }
        const stream = data.audioStreams
          .filter(s => s.mimeType?.includes('webm') || s.mimeType?.includes('opus'))
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]
          || data.audioStreams[0];
        if (stream && stream.url) return stream.url;
        this._triedInstances.push(instance);
      } catch {
        this._triedInstances.push(instance);
      }
    }
    return null;
  }

  _setupAudio(url) {
    this._audio = new Audio();
    this._audio.crossOrigin = 'anonymous';
    this._audio.preload = 'auto';
    this._audio.src = url;
    this._audio.volume = store.get('isMuted') ? 0 : store.get('volume');

    this._audio.addEventListener('ended', () => {
      if (this._endedHandler) this._endedHandler();
    });
    this._audio.addEventListener('error', () => {
      this._mode = null;
      this._destroyAudio();
    });
    this._audio.addEventListener('canplay', () => {
      this._ready = true;
    });

    this._routeThroughEq();
  }

  _routeThroughEq() {
    if (!this._audio) return;
    try {
      eqEngine.init();
      eqEngine.resume();
      const ctx = eqEngine.context;
      if (!ctx) return;
      this._ctx = ctx;
      this._sourceNode = ctx.createMediaElementSource(this._audio);
      eqEngine.connectSource(this._sourceNode, ctx);
    } catch {
      this._sourceNode = null;
      this._ctx = null;
    }
  }

  async load(song, startSeconds = 0) {
    if (this._loading) return false;
    this._loading = true;
    this._ready = false;
    this._clearProgress();
    eqEngine.disconnectSource();
    if (this._audio) this._destroyAudio();
    this._triedInstances = [];

    const url = await this._fetchStreamUrl();
    if (!url) {
      this._loading = false;
      return false;
    }

    this._setupAudio(url);

    if (startSeconds > 0) {
      this._audio.currentTime = startSeconds;
    }

    return new Promise((resolve) => {
      const onCanPlay = () => {
        this._audio.removeEventListener('canplay', onCanPlay);
        this._ready = true;
        this._loading = false;
        this._startProgress();
        resolve(true);
      };
      this._audio.addEventListener('canplay', onCanPlay);
      this._audio.addEventListener('error', () => {
        this._audio.removeEventListener('error', onError);
        this._loading = false;
        resolve(false);
      });
      const onError = () => {
        this._audio.removeEventListener('canplay', onCanPlay);
        this._loading = false;
        resolve(false);
      };
      this._audio.addEventListener('error', onError);
      this._audio.load();
    });
  }

  play() {
    if (this._audio && this._ready) {
      this._audio.play().catch(() => {});
    }
  }

  pause() {
    if (this._audio && this._ready) {
      this._audio.pause();
    }
  }

  toggle() {
    if (this._audio && this._ready) {
      if (this._audio.paused) {
        this._audio.play().catch(() => {});
      } else {
        this._audio.pause();
      }
    }
  }

  seek(time) {
    if (this._audio && this._ready) {
      this._audio.currentTime = time;
    }
  }

  setVolume(value) {
    this._lastVolume = value;
    if (this._audio) {
      this._audio.volume = store.get('isMuted') ? 0 : value;
    }
  }

  applyMute() {
    if (this._audio) {
      this._audio.volume = store.get('isMuted') ? 0 : this._lastVolume;
    }
  }

  get currentTime() {
    return this._audio ? this._audio.currentTime : 0;
  }

  get duration() {
    return this._audio ? this._audio.duration : 0;
  }

  get isPaused() {
    return this._audio ? this._audio.paused : true;
  }

  setOnEnded(handler) {
    this._endedHandler = handler;
  }

  _startProgress() {
    this._clearProgress();
    this._progressInterval = setInterval(() => {
      if (this._audio && !this._audio.paused) {
        store.setState('currentTime', this._audio.currentTime);
        store.setState('duration', this._audio.duration || 0);
      }
    }, 250);
  }

  _clearProgress() {
    if (this._progressInterval) {
      clearInterval(this._progressInterval);
      this._progressInterval = null;
    }
  }

  _destroyAudio() {
    this._clearProgress();
    if (this._sourceNode) {
      try { this._sourceNode.disconnect(); } catch {}
      this._sourceNode = null;
    }
    if (this._audio) {
      try { this._audio.pause(); } catch {}
      this._audio.src = '';
      this._audio.load();
      this._audio = null;
    }
    this._ready = false;
    this._streamUrl = null;
  }

  destroy() {
    this._triedInstances = [];
    eqEngine.disconnectSource();
    this._mode = null;
    this._destroyAudio();
    this._ctx = null;
  }
}

export const audioEngine = new AudioEngine();
