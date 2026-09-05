import { store } from './store.js';
import { APP_CONFIG } from '../config/app.js';

class AudioPlayer {
  constructor() {
    this._audio = null;
    this._volumeBeforeMute = store.get('volume');
    this._failStreak = 0;
    this._loadToken = 0;
    this._setupStoreListeners();
  }

  _setupStoreListeners() {
    store.on('change', ({ path }) => {
      if (path === 'volume') this._applyVolume();
      if (path === 'isMuted') this._applyMute();
    });

    store.on('play', ({ youtube_id }) => {
      this.load(youtube_id);
    });
  }

  async _fetchStream(videoId) {
    try {
      const r = await fetch(`/api/stream?id=${encodeURIComponent(videoId)}`, {
        signal: AbortSignal.timeout(15000)
      });
      if (!r.ok) return null;
      const j = await r.json();
      return (typeof j.url === 'string' && j.url.startsWith('http')) ? j.url : null;
    } catch {
      return null;
    }
  }

  _playStream(url) {
    if (!this._audio) this._audio = this._createAudio();
    this._audio.src = url;
    this._audio.volume = store.get('isMuted') ? 0 : store.get('volume');
    this._audio.playbackRate = store.get('playbackSpeed');
    this._audio.play().catch((e) => {
      if (e && e.name === 'AbortError') return;
      this._onPlaybackError();
    });
  }

  _createAudio() {
    const audio = new Audio();
    audio.onplaying = () => {
      this._failStreak = 0;
      store.setState('isBuffering', false);
      store.setState('isPlaying', true);
    };
    audio.onwaiting = () => store.setState('isBuffering', true);
    audio.onpause = () => store.setState('isPlaying', false);
    audio.onended = () => this._onEnded();
    audio.onloadedmetadata = () => { if (audio.duration) store.setState('duration', audio.duration); };
    audio.ontimeupdate = () => store.setState('currentTime', audio.currentTime);
    audio.onerror = () => this._onPlaybackError();
    return audio;
  }

  async load(videoId) {
    if (!videoId) return;
    const token = ++this._loadToken;
    store.setState('error', null);
    store.setState('currentTime', 0);
    store.setState('duration', 0);
    store.setState('isBuffering', true);

    const url = await this._fetchStream(videoId);
    if (token !== this._loadToken) return;
    if (url) {
      this._playStream(url);
      return;
    }
    this._onPlaybackError();
  }

  _onPlaybackError() {
    this._failStreak += 1;
    if (this._audio) {
      try { this._audio.pause(); } catch {}
    }
    const queueLen = store.get('queue').length;
    store.setState('isBuffering', false);
    if (queueLen > 1 && this._failStreak < queueLen) {
      store.setState('error', "Couldn't play this song — skipping");
      store.next();
    } else {
      store.setState('error', "Couldn't play this song");
      store.setState('isPlaying', false);
    }
  }

  _onEnded() {
    if (store.get('repeat') === 'one') {
      if (this._audio) {
        this._audio.currentTime = 0;
        this._audio.play().catch(() => {});
      }
      return;
    }
    store.emit('songEnded');
    store.next();
  }

  play() {
    if (this._audio) this._audio.play().catch(() => {});
  }

  pause() {
    if (this._audio) this._audio.pause();
  }

  toggle() {
    if (!this._audio) {
      const song = store.get('currentSong');
      if (song?.youtube_id) this.load(song.youtube_id);
      return;
    }
    if (this._audio.paused) {
      this._audio.play().catch(() => {});
    } else {
      this._audio.pause();
    }
  }

  seek(time) {
    if (!this._audio) return;
    try { this._audio.currentTime = time; } catch {}
    store.setState('currentTime', time);
  }

  setVolume(value) {
    const vol = Math.max(0, Math.min(1, value));
    store.setState('volume', vol);
    this._applyVolume();
    if (vol === 0) store.setState('isMuted', true);
    else if (store.get('isMuted')) store.setState('isMuted', false);
  }

  toggleMute() {
    if (store.get('isMuted')) {
      store.setState('isMuted', false);
      this._applyVolume();
    } else {
      this._volumeBeforeMute = store.get('volume');
      store.setState('isMuted', true);
      this._applyVolume();
    }
  }

  setPlaybackSpeed(speed) {
    store.setState('playbackSpeed', speed);
    if (this._audio) this._audio.playbackRate = speed;
  }

  _applyVolume() {
    if (this._audio) this._audio.volume = store.get('isMuted') ? 0 : store.get('volume');
  }

  _applyMute() {
    if (this._audio) {
      this._audio.volume = store.get('isMuted') ? 0 : (this._volumeBeforeMute || APP_CONFIG.defaults.volume);
    }
  }

  destroy() {
    if (this._audio) {
      try { this._audio.pause(); } catch {}
    }
  }
}

export const player = new AudioPlayer();
