import { $, html, getYouTubeThumbnail, formatTime } from '../js/utils.js';
import { store } from '../js/store.js';
import { render } from '../js/ui.js';
import { player } from '../js/player.js';

export function renderPlayerBar() {
  const container = $('#player-bar');
  if (!container) return;

  render(container, html`
    <div class="glass-nav border-t border-white/10 px-4 sm:px-6 h-20 flex items-center justify-between gap-4 player-content safe-bottom shadow-2xl backdrop-blur-xl">
      <!-- Track Info (Left) -->
      <div class="flex items-center gap-3 min-w-0 flex-1 max-w-[280px] sm:max-w-xs song-info-area">
        <div class="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-surface-elevated relative shadow-md cursor-pointer group" id="player-artwork" title="Open Now Playing" data-tooltip="Now Playing">
          <img src="assets/images/fallback-album.svg" alt="Album Cover" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" id="player-art-img" loading="lazy" decoding="async">
          <div id="buffering-spinner" class="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center hidden">
            <div class="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <div class="min-w-0 flex flex-col justify-center cursor-pointer flex-1" title="Go to Playlist">
          <div class="flex items-center gap-1.5 overflow-hidden">
            <p class="text-sm font-semibold text-white truncate marquee-node hover:text-brand transition-colors" id="player-title">No track selected</p>
            <span class="text-[9px] px-1.5 py-0.5 rounded bg-brand/20 text-brand font-bold uppercase tracking-wider hidden" id="player-hd-badge">HD</span>
          </div>
          <p class="text-xs text-slate-400 truncate mt-0.5" id="player-artist">Select a song to play</p>
        </div>
        <button class="btn-icon w-9 h-9 like-btn text-slate-400 hover:text-white transition-colors flex-shrink-0 hidden sm:flex items-center justify-center rounded-lg hover:bg-white/5" aria-label="Save to favorites" id="player-like-btn" title="Like Track" data-tooltip="Like Track">
          <span class="material-symbols-outlined text-lg">favorite_border</span>
        </button>
      </div>

      <!-- Playback Controls & Progress (Center) -->
      <div class="flex flex-col items-center flex-1 max-w-xl px-2 player-controls-area">
        <div class="flex items-center justify-center gap-2 sm:gap-3 mb-1">
          <button class="btn-icon w-8 h-8 shuffle-btn text-slate-400 hover:text-white transition-colors hidden sm:flex items-center justify-center rounded-lg hover:bg-white/5" aria-label="Toggle shuffle mode" aria-pressed="false" title="Shuffle (Off)" data-tooltip="Shuffle (Off)">
            <span class="material-symbols-outlined text-base">shuffle</span>
          </button>
          <button class="btn-icon w-9 h-9 prev-btn text-slate-200 hover:text-white transition-colors flex items-center justify-center rounded-lg hover:bg-white/5" aria-label="Previous track" title="Previous Track" data-tooltip="Previous Track">
            <span class="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button class="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center hover:scale-105 active:scale-95 shadow-lg shadow-brand/25 transition-all play-pause-btn" aria-label="Play or Pause" title="Play Track" data-tooltip="Play Track" id="play-pause-btn">
            <span class="material-symbols-outlined text-2xl play-icon transition-transform duration-200 ml-0.5">play_arrow</span>
          </button>
          <button class="btn-icon w-9 h-9 next-btn text-slate-200 hover:text-white transition-colors flex items-center justify-center rounded-lg hover:bg-white/5" aria-label="Next track" title="Next Track" data-tooltip="Next Track">
            <span class="material-symbols-outlined text-xl">skip_next</span>
          </button>
          <button class="btn-icon w-8 h-8 repeat-btn text-slate-400 hover:text-white transition-colors hidden sm:flex items-center justify-center rounded-lg hover:bg-white/5" aria-label="Toggle repeat mode" aria-pressed="false" title="Repeat (Off)" data-tooltip="Repeat (Off)">
            <span class="material-symbols-outlined text-base">repeat</span>
          </button>
          <div class="timeline-visualizer hidden md:flex items-end gap-[2px] h-5 w-6 ml-1" id="player-visualizer" aria-hidden="true" title="Audio Equalizer Spectrum">
            <div class="vis-bar"></div><div class="vis-bar"></div><div class="vis-bar"></div>
            <div class="vis-bar"></div><div class="vis-bar"></div>
          </div>
        </div>
        <div class="flex items-center gap-2.5 w-full progress-area relative">
          <span class="text-[11px] font-mono text-slate-400 w-9 text-right tabular-nums" id="current-time">0:00</span>
          <div class="flex-1 relative group flex items-center py-1">
            <input type="range" min="0" max="100" value="${store.get('duration') > 0 ? (store.get('currentTime') / store.get('duration')) * 100 : 0}" class="player-progress w-full" id="progress-bar" aria-label="Seek track position" touch-action="manipulation" title="Seek position">
            <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-elevated border border-white/10 text-white text-[10px] px-2 py-0.5 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-mono" id="progress-tooltip">0:00</div>
          </div>
          <span class="text-[11px] font-mono text-slate-400 w-9 tabular-nums" id="total-time">0:00</span>
        </div>
      </div>

      <!-- Volume & Utility Controls (Right) -->
      <div class="hidden md:flex items-center gap-2 flex-1 justify-end max-w-[260px] volume-area">
        <button class="btn-icon w-8 h-8 mute-btn text-slate-400 hover:text-white transition-colors flex items-center justify-center rounded-lg hover:bg-white/5" aria-label="Toggle mute" aria-pressed="false" title="Mute Volume" data-tooltip="Mute Volume">
          <span class="material-symbols-outlined text-base volume-icon">volume_up</span>
        </button>
        <div class="flex items-center w-20 relative group h-8 justify-center" title="Volume Slider" data-tooltip="Volume Slider">
          <input type="range" min="0" max="1" step="0.01" value="${store.get('volume')}" class="player-volume w-full" id="volume-bar" aria-label="Volume level" touch-action="manipulation" title="Volume level">
        </div>
        <button class="btn-icon w-8 h-8 queue-toggle text-slate-400 hover:text-white transition-colors flex items-center justify-center rounded-lg hover:bg-white/5 ml-1" aria-label="Toggle Queue Panel" title="Up Next Queue" data-tooltip="Up Next Queue">
          <span class="material-symbols-outlined text-base">queue_music</span>
        </button>
        <button class="btn-icon w-8 h-8 settings-toggle text-slate-400 hover:text-white transition-colors flex items-center justify-center rounded-lg hover:bg-white/5" aria-label="Audio Settings" title="Audio Settings" data-tooltip="Audio Settings">
          <span class="material-symbols-outlined text-base">settings</span>
        </button>
        <button class="btn-icon w-8 h-8 theme-toggle text-slate-400 hover:text-white transition-colors flex items-center justify-center rounded-lg hover:bg-white/5" aria-label="Toggle Dark/Light Mode" title="Theme Mode" data-tooltip="Theme Mode">
          <span class="material-symbols-outlined text-base">${document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>
    </div>
  `);

  bindPlayerEvents();
  setupMarquee();

  store.on('change', ({ path }) => {
    if (path === 'currentSong') { updatePlayerUI(); setupMarquee(); }
    if (path === 'isPlaying') { updatePlayState(); updateVisualizer(); }
    if (path === 'currentTime') updateProgress();
    if (path === 'duration') updateDuration();
    if (path === 'volume') updateVolumeUI();
    if (path === 'isMuted') updateMuteUI();
    if (path === 'shuffle') updateShuffleUI();
    if (path === 'repeat') updateRepeatUI();
    if (path === 'error') showError();
    if (path === 'isBuffering') updateBufferingUI();
    if (path === 'ratings') updateLikeUI();
    if (path === 'currentSong') updateLikeUI();
  });
}

function setupMarquee() {
  const title = $('#player-title');
  if (!title) return;
  const isOverflowing = title.scrollWidth > title.clientWidth;
  title.classList.toggle('marquee-active', isOverflowing);
}

function updateVisualizer() {
  const viz = $('#player-visualizer');
  if (!viz) return;
  viz.classList.toggle('is-playing', !!store.get('isPlaying'));
}

function bindPlayerEvents() {
  const container = $('#player-bar');

  container.addEventListener('click', (e) => {
    const playBtn = e.target.closest('.play-pause-btn');
    if (playBtn) { player.toggle(); return; }

    const nextBtn = e.target.closest('.next-btn');
    if (nextBtn) { store.next(); return; }

    const prevBtn = e.target.closest('.prev-btn');
    if (prevBtn) { store.prev(); return; }

    const shuffleBtn = e.target.closest('.shuffle-btn');
    if (shuffleBtn) { store.setState('shuffle', !store.get('shuffle')); return; }

    const repeatBtn = e.target.closest('.repeat-btn');
    if (repeatBtn) {
      const modes = ['off', 'all', 'one'];
      const current = store.get('repeat');
      const next = modes[(modes.indexOf(current) + 1) % modes.length];
      store.setState('repeat', next);
      return;
    }

    const muteBtn = e.target.closest('.mute-btn');
    if (muteBtn) { player.toggleMute(); return; }

    const settingsBtn = e.target.closest('.settings-toggle');
    if (settingsBtn) {
      import('./settings-panel.js').then(m => m.toggleSettings());
      return;
    }

    const themeBtn = e.target.closest('.theme-toggle');
    if (themeBtn) {
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
      localStorage.setItem('audiobytes-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      const icon = themeBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
      return;
    }

    const miniBtn = e.target.closest('.mini-toggle');
    if (miniBtn) {
      const bar = $('#player-bar');
      if (bar) bar.classList.toggle('mini-player');
      return;
    }

    const queueBtn = e.target.closest('.queue-toggle');
    if (queueBtn) {
      import('./queue-panel.js').then(m => m.toggleQueue());
      return;
    }

    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
      const song = store.get('currentSong');
      if (!song) return;
      store.toggleFavorite(song.id);
      updateLikeUI();
      const icon = likeBtn.querySelector('.material-symbols-outlined');
      if (icon) {
        icon.classList.remove('heart-bounce');
        void icon.offsetWidth;
        icon.classList.add('heart-bounce');
      }
      return;
    }
  });

  const progressBar = $('#progress-bar');
  if (progressBar) {
    let isSeeking = false;
    const updateProgressBackground = (val) => {
      progressBar.style.background = `linear-gradient(to right, var(--brand) 0%, var(--brand) ${val}%, rgba(255,255,255,0.12) ${val}%, rgba(255,255,255,0.12) 100%)`;
    };

    progressBar.addEventListener('input', () => {
      isSeeking = true;
      const val = parseFloat(progressBar.value);
      updateProgressBackground(val);
      const time = (val / 100) * store.get('duration');
      const formatted = formatTime(time);
      $('#current-time').textContent = formatted;
      const tooltip = $('#progress-tooltip');
      if (tooltip) {
        tooltip.textContent = formatted;
        tooltip.style.left = `${val}%`;
      }
    });

    progressBar.addEventListener('change', () => {
      const time = (progressBar.value / 100) * store.get('duration');
      player.seek(time);
      isSeeking = false;
    });

    store.on('change', ({ path }) => {
      if (path === 'currentTime' && !isSeeking) {
        const dur = store.get('duration');
        if (dur > 0) {
          const pct = (store.get('currentTime') / dur) * 100;
          progressBar.value = pct;
          updateProgressBackground(pct);
        }
      }
    });

    updateProgressBackground(0);
  }

  const volumeBar = $('#volume-bar');
  if (volumeBar) {
    const updateVolBg = (v) => {
      volumeBar.style.background = `linear-gradient(to right, var(--brand) 0%, var(--brand) ${v * 100}%, rgba(255,255,255,0.12) ${v * 100}%, rgba(255,255,255,0.12) 100%)`;
    };
    volumeBar.addEventListener('input', () => {
      const v = parseFloat(volumeBar.value);
      player.setVolume(v);
      updateVolBg(v);
    });
    updateVolBg(store.get('volume'));
  }

  const songInfo = $('.song-info-area');
  if (songInfo) {
    songInfo.addEventListener('click', (e) => {
      const artwork = e.target.closest('#player-artwork');
      if (artwork) {
        import('./now-playing.js').then(m => m.openNowPlaying());
        return;
      }
      const song = store.get('currentSong');
      if (song && song.playlistId) {
        import('../js/router.js').then(r => r.router.navigate(`/playlist/${song.playlistId}`));
      }
    });
  }
}

function updatePlayerUI() {
  const song = store.get('currentSong');
  const artImg = $('#player-art-img');
  const title = $('#player-title');
  const artist = $('#player-artist');
  const hdBadge = $('#player-hd-badge');

  if (!song) {
    if (artImg) artImg.src = 'assets/images/fallback-album.svg';
    if (title) title.textContent = 'No track selected';
    if (artist) artist.textContent = 'Select a song to play';
    if (hdBadge) hdBadge.classList.add('hidden');
    return;
  }

  if (artImg) {
    artImg.onerror = () => { artImg.src = 'assets/images/fallback-album.svg'; };
    artImg.src = song.youtube_id
      ? getYouTubeThumbnail(song.youtube_id, 'mqdefault')
      : 'assets/images/fallback-album.svg';
  }
  if (title) title.textContent = song.title;
  if (artist) artist.textContent = song.artist;
  if (hdBadge) hdBadge.classList.toggle('hidden', !song.is_hd);
}

function updatePlayState() {
  const icon = $('.play-icon');
  if (!icon) return;
  const isPlaying = store.get('isPlaying');
  icon.textContent = isPlaying ? 'pause' : 'play_arrow';
  icon.style.transform = isPlaying ? 'rotate(90deg)' : 'rotate(0deg)';
  const btn = $('#play-pause-btn');
  if (btn) {
    const label = isPlaying ? 'Pause Track' : 'Play Track';
    btn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    btn.setAttribute('title', label);
    btn.setAttribute('data-tooltip', label);
  }
}

function updateProgress() {
  const current = $('#current-time');
  if (current) current.textContent = formatTime(store.get('currentTime'));
}

function updateDuration() {
  const total = $('#total-time');
  if (total) total.textContent = formatTime(store.get('duration'));
}

function updateVolumeUI() {
  const vol = store.get('volume');
  const volBar = $('#volume-bar');
  if (volBar) volBar.value = vol;
  const icon = $('.volume-icon');
  if (icon) icon.textContent = vol === 0 ? 'volume_off' : vol < 0.5 ? 'volume_down' : 'volume_up';
}

function updateMuteUI() {
  const icon = $('.volume-icon');
  if (!icon) return;
  const muted = store.get('isMuted');
  icon.textContent = muted ? 'volume_off' : store.get('volume') < 0.5 ? 'volume_down' : 'volume_up';
  const btn = $('.mute-btn');
  if (btn) {
    btn.setAttribute('aria-pressed', String(muted));
    const label = muted ? 'Unmute Volume' : 'Mute Volume';
    btn.setAttribute('title', label);
    btn.setAttribute('data-tooltip', label);
  }
}

function updateShuffleUI() {
  const btn = $('.shuffle-btn');
  if (!btn) return;
  const on = store.get('shuffle');
  btn.classList.toggle('active', on);
  btn.setAttribute('aria-pressed', String(on));
  const label = on ? 'Shuffle (On)' : 'Shuffle (Off)';
  btn.setAttribute('title', label);
  btn.setAttribute('data-tooltip', label);
}

function updateRepeatUI() {
  const btn = $('.repeat-btn');
  if (!btn) return;
  const mode = store.get('repeat');
  const isActive = mode !== 'off';
  btn.classList.toggle('active', isActive);
  btn.setAttribute('aria-pressed', String(isActive));
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = mode === 'one' ? 'repeat_one' : 'repeat';
  const label = mode === 'one' ? 'Repeat (One)' : mode === 'all' ? 'Repeat (All)' : 'Repeat (Off)';
  btn.setAttribute('title', label);
  btn.setAttribute('data-tooltip', label);
}

function showError() {
  const err = store.get('error');
  if (err) {
    import('./toast.js').then(m => m.showToast(err, 'error'));
  }
}

function updateLikeUI() {
  const btn = $('#player-like-btn');
  if (!btn) return;
  const song = store.get('currentSong');
  const favs = store.getLikedIds();
  const isFav = song && favs.includes(song.id);
  btn.classList.toggle('text-red-400', !!isFav);
  btn.classList.toggle('text-slate-400', !isFav);
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = isFav ? 'favorite' : 'favorite_border';
  btn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Like');
}

function updateBufferingUI() {
  const spinner = $('#buffering-spinner');
  if (!spinner) return;
  spinner.classList.toggle('hidden', !store.get('isBuffering'));
}
