import { APP_CONFIG } from '../config/app.js';
import { safeJSON } from './utils.js';

class Store {
  constructor() {
    this._listeners = new Map();
    this._state = {
      playlists: [],
      currentPlaylist: null,
      currentSong: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      volume: APP_CONFIG.defaults.volume,
      playbackSpeed: APP_CONFIG.defaults.playbackSpeed,
      shuffle: APP_CONFIG.defaults.shuffle,
      repeat: APP_CONFIG.defaults.repeat,
      currentTime: 0,
      duration: 0,
      viewMode: APP_CONFIG.defaults.viewMode,
      sortBy: APP_CONFIG.defaults.sortBy,
      recentlyPlayed: [],
      isMuted: false,
      isBuffering: false,
      loading: true,
      error: null,
      favorites: [],
      eq: {
        enabled: true,
        preset: 'Normal',
        gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        bypassed: false
      }
    };
    this._loadPersistedState();
  }

  get state() {
    return this._state;
  }

  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event).push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    const handlers = this._listeners.get(event);
    if (handlers) this._listeners.set(event, handlers.filter(h => h !== fn));
  }

  _emit(event, data) {
    const handlers = this._listeners.get(event);
    if (handlers) handlers.forEach(fn => fn(data));
  }

  _emitChange(path) {
    this._emit('change', { path, state: this._state });
  }

  setState(key, value) {
    if (this._state[key] !== value) {
      this._state[key] = value;
      this._emitChange(key);
      this._persist(key);
    }
  }

  get(key) {
    return this._state[key];
  }

  _persist(key) {
    const persistKeys = ['volume', 'shuffle', 'repeat', 'viewMode', 'sortBy', 'playbackSpeed', 'recentlyPlayed', 'isMuted', 'favorites', 'eq'];
    if (!persistKeys.includes(key)) return;
    try {
      localStorage.setItem(APP_CONFIG.storage.keys.preferences, JSON.stringify({
        volume: this._state.volume,
        shuffle: this._state.shuffle,
        repeat: this._state.repeat,
        viewMode: this._state.viewMode,
        sortBy: this._state.sortBy,
        playbackSpeed: this._state.playbackSpeed,
        isMuted: this._state.isMuted,
        favorites: this._state.favorites,
        eq: this._state.eq
      }));
      if (key === 'recentlyPlayed') {
        localStorage.setItem(APP_CONFIG.storage.keys.recentlyPlayed, JSON.stringify(this._state.recentlyPlayed));
      }
    } catch {}
  }

  _loadPersistedState() {
    try {
      const prefs = safeJSON(localStorage.getItem(APP_CONFIG.storage.keys.preferences), {});
      if (prefs.volume !== undefined) this._state.volume = prefs.volume;
      if (prefs.shuffle !== undefined) this._state.shuffle = prefs.shuffle;
      if (prefs.repeat !== undefined) this._state.repeat = prefs.repeat;
      if (prefs.viewMode !== undefined) this._state.viewMode = prefs.viewMode;
      if (prefs.sortBy !== undefined) this._state.sortBy = prefs.sortBy;
      if (prefs.playbackSpeed !== undefined) this._state.playbackSpeed = prefs.playbackSpeed;
      if (prefs.isMuted !== undefined) this._state.isMuted = prefs.isMuted;
      if (prefs.favorites !== undefined) this._state.favorites = prefs.favorites;
      if (prefs.eq !== undefined) this._state.eq = prefs.eq;
      const recent = safeJSON(localStorage.getItem(APP_CONFIG.storage.keys.recentlyPlayed), []);
      if (recent.length) this._state.recentlyPlayed = recent;
    } catch {}
  }

  async loadPlaylists() {
    try {
      this.setState('loading', true);
      const res = await fetch('data/playlists.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this._state.playlists = data;
      this.setState('loading', false);
      return data;
    } catch (err) {
      this.setState('error', err.message);
      this.setState('loading', false);
      return [];
    }
  }

  getPlaylist(id) {
    return this._state.playlists.find(p => p.id === id) || null;
  }

  getSong(playlistId, songId) {
    const pl = this.getPlaylist(playlistId);
    if (!pl) return null;
    return pl.songs.find(s => s.id === songId) || null;
  }

  getAllSongs() {
    return this._state.playlists.flatMap(p =>
      p.songs.map(s => ({ ...s, playlistId: p.id, playlistName: p.name, playlistCover: p.cover }))
    );
  }

  playPlaylist(playlistId, startIndex = 0) {
    const pl = this.getPlaylist(playlistId);
    if (!pl) return;
    const songs = pl.songs.map((s, i) => ({ ...s, playlistId, playlistName: pl.name, playlistCover: pl.cover }));
    this._state.queue = songs;
    this._state.queueIndex = startIndex;
    this._state.currentPlaylist = pl;
    this._state.currentSong = songs[startIndex];
    this._state.currentTime = 0;
    this._emitChange('queue');
    this._emitChange('queueIndex');
    this._emitChange('currentSong');
    this._emitChange('currentTime');
    this.setState('isPlaying', true);
    this._addToRecent(songs[startIndex]);
    this._emit('play', songs[startIndex]);
  }

  playSong(song, playlistId, playlistName, playlistCover) {
    const fullSong = { ...song, playlistId, playlistName, playlistCover };
    this._state.queue = [fullSong];
    this._state.queueIndex = 0;
    this._state.currentSong = fullSong;
    this._state.currentPlaylist = this.getPlaylist(playlistId);
    this._state.currentTime = 0;
    this._emitChange('queue');
    this._emitChange('queueIndex');
    this._emitChange('currentSong');
    this._emitChange('currentTime');
    this.setState('isPlaying', true);
    this._addToRecent(fullSong);
    this._emit('play', fullSong);
  }

  playFromQueue(songs, index) {
    this._state.queue = songs;
    this._state.queueIndex = index;
    this._state.currentSong = songs[index];
    this._state.currentTime = 0;
    this._emitChange('queue');
    this._emitChange('queueIndex');
    this._emitChange('currentSong');
    this._emitChange('currentTime');
    this.setState('isPlaying', true);
    this._addToRecent(songs[index]);
    this._emit('play', songs[index]);
  }

  next() {
    if (!this._state.queue.length) return;
    let nextIndex;
    if (this._state.shuffle) {
      if (this._state.queue.length > 1) {
        do { nextIndex = Math.floor(Math.random() * this._state.queue.length); }
        while (nextIndex === this._state.queueIndex);
      } else {
        nextIndex = 0;
      }
    } else {
      nextIndex = this._state.queueIndex + 1;
      if (nextIndex >= this._state.queue.length) {
        if (this._state.repeat === 'all') nextIndex = 0;
        else { this.setState('isPlaying', false); return; }
      }
    }
    this._state.queueIndex = nextIndex;
    this._state.currentSong = this._state.queue[nextIndex];
    this._state.currentTime = 0;
    this._state.duration = 0;
    this._emitChange('queueIndex');
    this._emitChange('currentSong');
    this._emitChange('currentTime');
    this._emitChange('duration');
    this.setState('isPlaying', true);
    this._addToRecent(this._state.currentSong);
    this._emit('play', this._state.currentSong);
  }

  prev() {
    if (!this._state.queue.length) return;
    let prevIndex;
    if (this._state.shuffle) {
      if (this._state.queue.length > 1) {
        do { prevIndex = Math.floor(Math.random() * this._state.queue.length); }
        while (prevIndex === this._state.queueIndex);
      } else {
        prevIndex = 0;
      }
    } else {
      prevIndex = this._state.queueIndex - 1;
      if (prevIndex < 0) {
        if (this._state.repeat === 'all') prevIndex = this._state.queue.length - 1;
        else { this.setState('isPlaying', false); return; }
      }
    }
    this._state.queueIndex = prevIndex;
    this._state.currentSong = this._state.queue[prevIndex];
    this._state.currentTime = 0;
    this._state.duration = 0;
    this._emitChange('queueIndex');
    this._emitChange('currentSong');
    this._emitChange('currentTime');
    this._emitChange('duration');
    this.setState('isPlaying', true);
    this._addToRecent(this._state.currentSong);
    this._emit('play', this._state.currentSong);
  }

  togglePlay() {
    this.setState('isPlaying', !this._state.isPlaying);
  }

  _addToRecent(song) {
    const recent = this._state.recentlyPlayed.filter(s => !(s.id === song.id && s.playlistId === song.playlistId));
    recent.unshift(song);
    if (recent.length > 20) recent.length = 20;
    this._state.recentlyPlayed = recent;
    this._emitChange('recentlyPlayed');
    this._persist('recentlyPlayed');
  }
}

export const store = new Store();
