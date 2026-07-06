import { $, html, getYouTubeThumbnail, formatTime } from '../js/utils.js';
import { store } from '../js/store.js';
import { render } from '../js/ui.js';
import { player } from '../js/player.js';

export function renderPlayerBar() {
  const container = $('#player-bar');
  if (!container) return;

  render(container, html`
    <div class="glass-nav border-t border-white/5 px-4 h-20 flex items-center justify-between gap-4 player-content">
      <div class="flex items-center gap-3 min-w-0 flex-1 max-w-md song-info-area">
        <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-elevated relative" id="player-artwork">
          <img src="assets/images/fallback-album.svg" alt="" class="w-full h-full object-cover" id="player-art-img">
          <div id="buffering-spinner" class="absolute inset-0 bg-black/40 flex items-center justify-center hidden">
            <div class="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <div class="min-w-0 flex flex-col">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-white truncate" id="player-title">No track selected</p>
          </div>
          <p class="text-xs text-slate-400 truncate" id="player-artist">Select a song to play</p>
        </div>
        <button class="btn-icon w-8 h-8 like-btn text-sm flex-shrink-0 hidden sm:flex" aria-label="Like" id="player-like-btn">
          <span class="material-symbols-outlined text-sm">favorite_border</span>
        </button>
      </div>

      <div class="flex flex-col items-center flex-1 max-w-2xl player-controls-area">
        <div class="flex items-center gap-2 mb-1">
          <button class="btn-icon w-8 h-8 shuffle-btn hidden sm:flex" aria-label="Toggle shuffle" aria-pressed="false" title="Shuffle">
            <span class="material-symbols-outlined text-sm">shuffle</span>
          </button>
          <button class="btn-icon w-8 h-8 prev-btn" aria-label="Previous" title="Previous">
            <span class="material-symbols-outlined text-sm">skip_previous</span>
          </button>
          <button class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform play-pause-btn" aria-label="Play/Pause">
            <span class="material-symbols-outlined text-lg play-icon">play_arrow</span>
          </button>
          <button class="btn-icon w-8 h-8 next-btn" aria-label="Next" title="Next">
            <span class="material-symbols-outlined text-sm">skip_next</span>
          </button>
          <button class="btn-icon w-8 h-8 repeat-btn hidden sm:flex" aria-label="Toggle repeat" aria-pressed="false" title="Repeat">
            <span class="material-symbols-outlined text-sm">repeat</span>
          </button>
          <button class="btn-icon w-8 h-8 eq-toggle-btn hidden sm:flex" aria-label="Equalizer" aria-pressed="false" title="Equalizer">
            <span class="material-symbols-outlined text-sm">graphic_eq</span>
          </button>
        </div>
        <div class="flex items-center gap-2 w-full progress-area">
          <span class="text-[11px] text-slate-500 w-10 text-right tabular-nums" id="current-time">0:00</span>
          <div class="flex-1 relative">
            <input type="range" min="0" max="100" value="${store.get('duration') > 0 ? (store.get('currentTime') / store.get('duration')) * 100 : 0}" class="player-progress w-full" id="progress-bar" aria-label="Seek">
          </div>
          <span class="text-[11px] text-slate-500 w-10 tabular-nums" id="total-time">0:00</span>
        </div>
      </div>

      <div class="hidden md:flex items-center gap-2 flex-1 justify-end max-w-md volume-area">
        <button class="btn-icon w-8 h-8 mute-btn" aria-label="Toggle mute" aria-pressed="false" title="Mute">
          <span class="material-symbols-outlined text-sm volume-icon">volume_up</span>
        </button>
        <input type="range" min="0" max="1" step="0.01" value="${store.get('volume')}" class="player-volume" id="volume-bar" aria-label="Volume">
        <button class="btn-icon w-8 h-8 mini-toggle hidden lg:flex" aria-label="Toggle mini player" title="Mini player">
          <span class="material-symbols-outlined text-sm">picture_in_picture</span>
        </button>
        <button class="btn-icon w-8 h-8 queue-toggle hidden lg:flex" aria-label="Toggle queue" title="Queue">
          <span class="material-symbols-outlined text-sm">queue_music</span>
        </button>
      </div>
    </div>
  `);

  bindPlayerEvents();

  store.on('change', ({ path }) => {
    if (path === 'currentSong') updatePlayerUI();
    if (path === 'isPlaying') updatePlayState();
    if (path === 'currentTime') updateProgress();
    if (path === 'duration') updateDuration();
    if (path === 'volume') updateVolumeUI();
    if (path === 'isMuted') updateMuteUI();
    if (path === 'shuffle') updateShuffleUI();
    if (path === 'repeat') updateRepeatUI();
    if (path === 'error') showError();
    if (path === 'isBuffering') updateBufferingUI();
    if (path === 'favorites') updateLikeUI();
    if (path === 'currentSong') updateLikeUI();
  });
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

    const eqBtn = e.target.closest('.eq-toggle-btn');
    if (eqBtn) {
      import('./equalizer-panel.js').then(m => m.toggleEqPanel());
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
      const favs = [...(store.get('favorites') || [])];
      const idx = favs.indexOf(song.id);
      if (idx > -1) { favs.splice(idx, 1); }
      else { favs.push(song.id); }
      store.setState('favorites', favs);
      updateLikeUI();
      import('./toast.js').then(m => m.showToast(idx > -1 ? 'Removed from favorites' : 'Added to favorites'));
      return;
    }
  });

  const progressBar = $('#progress-bar');
  if (progressBar) {
    let isSeeking = false;
    progressBar.addEventListener('input', () => {
      isSeeking = true;
      const time = (progressBar.value / 100) * store.get('duration');
      $('#current-time').textContent = formatTime(time);
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
          progressBar.value = (store.get('currentTime') / dur) * 100;
        }
      }
    });
    progressBar.addEventListener('mouseenter', () => progressBar.style.height = '6px');
    progressBar.addEventListener('mouseleave', () => progressBar.style.height = '4px');
  }

  const volumeBar = $('#volume-bar');
  if (volumeBar) {
    volumeBar.addEventListener('input', () => {
      player.setVolume(parseFloat(volumeBar.value));
    });
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

  if (!song) {
    if (artImg) artImg.src = 'assets/images/fallback-album.svg';
    if (title) title.textContent = 'No track selected';
    if (artist) artist.textContent = 'Select a song to play';
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
}

function updatePlayState() {
  const icon = $('.play-icon');
  if (!icon) return;
  icon.textContent = store.get('isPlaying') ? 'pause' : 'play_arrow';
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
  if (btn) btn.setAttribute('aria-pressed', String(muted));
}

function updateShuffleUI() {
  const btn = $('.shuffle-btn');
  if (!btn) return;
  const on = store.get('shuffle');
  btn.classList.toggle('active', on);
  btn.setAttribute('aria-pressed', String(on));
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
  const favs = store.get('favorites') || [];
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
