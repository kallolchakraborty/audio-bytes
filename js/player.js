import { store } from './store.js';
import { APP_CONFIG } from '../config/app.js';
import { audioEngine } from './audio-engine.js';

class AudioPlayer {
  constructor() {
    this._ready = false;
    this._player = null;
    this._volumeBeforeMute = store.get('volume');
    this._initResolve = null;
    this._initPromise = new Promise((resolve) => { this._initResolve = resolve; });
    this._usingAudioEngine = false;
    this._subs = [];
    this._setupStoreListeners();
    this._initYouTubeAPI();
  }

  get isEqActive() {
    return this._usingAudioEngine;
  }

  _initYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      this._ready = true;
      this._createPlayer();
      this._initResolve();
      return;
    }
    window.onYouTubeIframeAPIReady = () => {
      this._ready = true;
      this._createPlayer();
      this._initResolve();
    };
    const check = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(check);
        if (!this._ready) {
          this._ready = true;
          this._createPlayer();
          this._initResolve();
        }
      }
    }, 200);
    setTimeout(() => {
      clearInterval(check);
      if (!this._ready) {
        this._createPlayer();
        this._ready = true;
        this._initResolve();
      }
    }, 15000);
  }

  _createPlayer() {
    const container = document.getElementById('youtube-player');
    if (!container) return;

    this._player = new YT.Player(container, {
      height: 0,
      width: 0,
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        iv_load_policy: 3,
        cc_load_policy: 0
      },
      events: {
        onReady: () => {
          this._ready = true;
          this._player.setVolume(store.get('isMuted') ? 0 : store.get('volume') * 100);
          this._player.setPlaybackRate(store.get('playbackSpeed'));
        },
        onStateChange: (e) => this._onPlayerStateChange(e),
        onError: () => store.setState('error', 'YouTube playback error')
      }
    });
  }

  _onPlayerStateChange(e) {
    switch (e.data) {
      case YT.PlayerState.PLAYING:
        store.setState('isBuffering', false);
        store.setState('isPlaying', true);
        break;
      case YT.PlayerState.PAUSED:
        store.setState('isBuffering', false);
        store.setState('isPlaying', false);
        break;
      case YT.PlayerState.ENDED:
        this._onEnded();
        break;
      case YT.PlayerState.BUFFERING:
        store.setState('isBuffering', true);
        break;
      case YT.PlayerState.CUED:
        break;
    }
  }

  _onEnded() {
    const mode = store.get('repeat');
    if (mode === 'one') {
      if (this._usingAudioEngine) {
        audioEngine.seek(0);
        audioEngine.play();
      } else if (this._player) {
        this._player.seekTo(0, true);
        this._player.playVideo();
      }
    } else {
      store.next();
    }
  }

  _setupStoreListeners() {
    store.on('change', ({ path }) => {
      if (path === 'volume') this._applyVolume();
      if (path === 'isMuted') this._applyMute();
      if (path === 'playbackSpeed') {
        if (this._player && this._ready && !this._usingAudioEngine) {
          try { this._player.setPlaybackRate(store.get('playbackSpeed')); } catch {}
        }
      }
    });

    store.on('play', ({ youtube_id }) => this.load(youtube_id));
  }

  async _ensureReady() {
    if (this._ready && this._player) return;
    await this._initPromise;
  }

  async load(videoId) {
    if (!videoId) return;
    store.setState('error', null);
    store.setState('currentTime', 0);
    store.setState('duration', 0);

    this._usingAudioEngine = false;

    const ok = await audioEngine.load(videoId);
    if (ok) {
      this._usingAudioEngine = true;
      audioEngine.setOnEnded(() => this._onEnded());

      audioEngine.setVolume(store.get('isMuted') ? 0 : store.get('volume'));

      audioEngine.play();
      store.setState('isPlaying', true);
      store.setState('isBuffering', false);
      this._showEqStatus(true);
      return;
    }

    this._showEqStatus(false);

    await this._ensureReady();

    try {
      this._player.loadVideoById({ videoId, startSeconds: 0, suggestedQuality: 'hd1080' });
      this._player.setVolume(store.get('isMuted') ? 0 : store.get('volume') * 100);
      this._player.setPlaybackRate(store.get('playbackSpeed'));
      try { this._player.setPlaybackQuality('hd1080'); } catch {}
    } catch {
      store.setState('error', 'Failed to load video');
    }

    this._trackProgress();
  }

  _showEqStatus(enabled) {
    import('../components/toast.js').then(m => {
      if (enabled) {
        m.showToast('Equalizer active — audio routed through Web Audio filters', 'success', 4000);
      } else {
        m.showToast('YouTube stream — equalizer is visual only. Audio processing requires a streamable audio source.', 'info', 5000);
      }
    });
  }

  _trackProgress() {
    if (this._progressInterval) clearInterval(this._progressInterval);
    this._progressInterval = setInterval(() => {
      if (this._usingAudioEngine) {
        if (!audioEngine.isPaused) {
          store.setState('currentTime', audioEngine.currentTime);
          store.setState('duration', audioEngine.duration || 0);
        }
        return;
      }
      if (!this._player || !this._ready) return;
      try {
        const state = this._player.getPlayerState();
        if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.PAUSED) {
          const time = this._player.getCurrentTime();
          const dur = this._player.getDuration();
          if (time > 0) store.setState('currentTime', time);
          if (dur > 0) store.setState('duration', dur);
        }
      } catch {}
    }, 250);
  }

  play() {
    if (this._usingAudioEngine) {
      audioEngine.play();
      return;
    }
    if (this._player && this._ready) {
      this._player.playVideo();
    } else {
      store.togglePlay();
    }
  }

  pause() {
    if (this._usingAudioEngine) {
      audioEngine.pause();
      return;
    }
    if (this._player && this._ready) {
      this._player.pauseVideo();
    }
  }

  toggle() {
    if (this._usingAudioEngine) {
      audioEngine.toggle();
      return;
    }
    if (!this._player || !this._ready) {
      if (store.get('currentSong')) {
        this.load(store.get('currentSong').youtube_id);
      }
      return;
    }
    try {
      const state = this._player.getPlayerState();
      if (state === YT.PlayerState.PLAYING) {
        this._player.pauseVideo();
      } else {
        this._player.playVideo();
      }
    } catch {
      if (store.get('currentSong')) {
        this.load(store.get('currentSong').youtube_id);
      }
    }
  }

  seek(time) {
    if (this._usingAudioEngine) {
      audioEngine.seek(time);
      store.setState('currentTime', time);
      return;
    }
    if (this._player && this._ready) {
      this._player.seekTo(time, true);
      store.setState('currentTime', time);
    }
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
      if (this._usingAudioEngine) {
        audioEngine.applyMute();
      } else if (this._player && this._ready) {
        this._player.mute();
      }
    }
  }

  setPlaybackSpeed(speed) {
    store.setState('playbackSpeed', speed);
    if (!this._usingAudioEngine && this._player && this._ready) {
      try { this._player.setPlaybackRate(speed); } catch {}
    }
  }

  _applyVolume() {
    if (this._usingAudioEngine) {
      audioEngine.setVolume(store.get('volume'));
      return;
    }
    if (!this._player || !this._ready) return;
    const vol = store.get('isMuted') ? 0 : store.get('volume');
    if (vol === 0) {
      this._player.mute();
      this._player.setVolume(0);
    } else {
      this._player.unMute();
      this._player.setVolume(vol * 100);
    }
  }

  _applyMute() {
    if (this._usingAudioEngine) {
      audioEngine.applyMute();
      return;
    }
    if (!this._player || !this._ready) return;
    if (store.get('isMuted')) {
      this._volumeBeforeMute = store.get('volume');
      this._player.mute();
    } else {
      this._player.unMute();
      this._player.setVolume((this._volumeBeforeMute || APP_CONFIG.defaults.volume) * 100);
    }
  }

  destroy() {
    if (this._progressInterval) clearInterval(this._progressInterval);
    audioEngine.destroy();
    if (this._player) {
      try { this._player.stopVideo(); } catch {}
    }
  }
}

export const player = new AudioPlayer();
