import { $, getYouTubeThumbnail, formatTime } from '../js/utils.js';
import { store } from '../js/store.js';
import { player } from '../js/player.js';
import { trapFocus } from '../js/ui.js';

let _lastFocus = null;
let _cleanupTrap = null;
let _onKeyDown = null;

export function openNowPlaying() {
  let overlay = $('#now-playing');
  if (overlay) { closeNowPlaying(); return; }

  _lastFocus = document.activeElement;
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.setAttribute('aria-hidden', 'true'));
  overlay = document.createElement('div');
  overlay.id = 'now-playing';
  document.body.appendChild(overlay);
  renderNowPlaying(overlay);
  _cleanupTrap = trapFocus(overlay);
  _onKeyDown = (e) => { if (e.key === 'Escape') closeNowPlaying(); };
  document.addEventListener('keydown', _onKeyDown);
}

export function closeNowPlaying() {
  if (_onKeyDown) {
    document.removeEventListener('keydown', _onKeyDown);
    _onKeyDown = null;
  }
  if (_cleanupTrap) { _cleanupTrap(); _cleanupTrap = null; }
  const overlay = $('#now-playing');
  if (overlay) {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 300);
  }
  document.querySelectorAll('#header, #sidebar, #page-view, #player-bar, #toast-container').forEach(el => el?.removeAttribute('aria-hidden'));
  if (_lastFocus) { _lastFocus.focus(); _lastFocus = null; }
}

function renderNowPlaying(overlay) {
  const song = store.get('currentSong');
  if (!song) { closeNowPlaying(); return; }

  const isPlaying = store.get('isPlaying');
  const dur = store.get('duration');
  const ct = store.get('currentTime');
  const vol = store.get('volume');
  const shuffle = store.get('shuffle');
  const repeat = store.get('repeat');
  const speed = store.get('playbackSpeed');
  const isFav = store.getLikedIds().includes(song.id);
  const isDisliked = store.getDislikedIds().includes(song.id);

  const thumb = song.youtube_id ? getYouTubeThumbnail(song.youtube_id, 'hqdefault') : 'assets/images/fallback-album.svg';

  overlay.innerHTML = `
    <div class="fixed inset-0 z-[60] flex flex-col bg-surface overflow-hidden" role="dialog" aria-modal="true" aria-label="Now Playing" style="--np-bg: #0F1115;">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-surface"></div>
        <img src="${thumb}" alt="" class="w-full h-full object-cover opacity-20 blur-3xl" id="np-blur-bg" crossorigin="anonymous">
      </div>

      <div class="relative z-10 flex items-center justify-between px-4 h-14">
        <button class="np-close btn-icon" aria-label="Close now playing">
          <span class="material-symbols-outlined text-lg">expand_more</span>
        </button>
        <div class="flex items-center gap-1">
          <button class="np-view-toggle btn-icon w-7 h-7 active" data-view="playing" aria-label="Now Playing view">
            <span class="material-symbols-outlined text-sm">music_note</span>
          </button>
          <button class="np-view-toggle btn-icon w-7 h-7" data-view="lyrics" aria-label="Lyrics view">
            <span class="material-symbols-outlined text-sm">lyrics</span>
          </button>
        </div>
        <div class="w-10"></div>
      </div>

      <div id="np-main" class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-6 overflow-y-auto"></div>
    </div>
  `;

  renderNowPlayingView();
  bindNowPlayingEvents(overlay);
  extractAvgColor(thumb);

  store.on('change', function handler({ path }) {
    if (path === 'isPlaying') updateNpPlayState();
    if (path === 'currentTime') updateNpProgress();
    if (path === 'duration') updateNpDuration();
    if (path === 'volume' || path === 'isMuted') updateNpVolume();
    if (path === 'shuffle') updateNpShuffle();
    if (path === 'repeat') updateNpRepeat();
    if (path === 'ratings') updateNpRatingButtons();
    if (path === 'currentSong') {
      store.off('change', handler);
      closeNowPlaying();
    }
  });
}

function renderNowPlayingView() {
  const main = $('#np-main');
  if (!main) return;
  const song = store.get('currentSong');
  if (!song) return;
  const isPlaying = store.get('isPlaying');
  const dur = store.get('duration');
  const ct = store.get('currentTime');
  const vol = store.get('volume');
  const shuffle = store.get('shuffle');
  const repeat = store.get('repeat');
  const speed = store.get('playbackSpeed');
  const isFav = store.getLikedIds().includes(song.id);
  const isDisliked = store.getDislikedIds().includes(song.id);
  const thumb = song.youtube_id ? getYouTubeThumbnail(song.youtube_id, 'hqdefault') : 'assets/images/fallback-album.svg';

  main.innerHTML = `
    <div class="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 cover-art-glow flex-shrink-0 ${isPlaying ? 'playing' : ''}" id="np-art-container">
      <img src="${thumb}" alt="${song.title}" class="w-full h-full object-cover" id="np-art" crossorigin="anonymous"
           onerror="this.src='assets/images/fallback-album.svg'">
    </div>

    <div class="text-center max-w-md">
      <div class="flex items-center justify-center gap-2">
        <h2 class="text-2xl font-bold text-white truncate">${song.title}</h2>
        ${song.is_hd ? `<span class="text-[10px] px-2 py-0.5 rounded bg-brand/20 text-brand font-bold uppercase tracking-wider shadow-sm flex-shrink-0">HD</span>` : ''}
      </div>
      <p class="text-base text-slate-400 mt-1 truncate">${song.artist}</p>
      <p class="text-sm text-slate-500 mt-0.5 truncate">${song.album || ''}</p>
      <div class="flex items-center justify-center gap-2 mt-3">
        <button class="np-like-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all ${isFav ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}" aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
          <span class="material-symbols-outlined text-sm">${isFav ? 'favorite' : 'favorite_border'}</span>
          ${isFav ? 'Liked' : 'Like'}
        </button>
        <button class="np-dislike-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all ${isDisliked ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}" aria-label="${isDisliked ? 'Remove dislike' : 'Dislike'}">
          <span class="material-symbols-outlined text-sm">${isDisliked ? 'thumb_down' : 'thumb_down_off_alt'}</span>
          ${isDisliked ? 'Disliked' : 'Dislike'}
        </button>
      </div>
    </div>

    <div class="w-full max-w-lg">
      <div class="flex items-center gap-3 w-full">
        <span class="text-xs text-slate-500 w-10 text-right tabular-nums" id="np-current-time">${formatTime(ct)}</span>
        <input type="range" min="0" max="100" value="${dur > 0 ? (ct / dur) * 100 : 0}" class="np-progress flex-1" id="np-progress-bar" aria-label="Seek">
        <span class="text-xs text-slate-500 w-10 tabular-nums" id="np-total-time">${formatTime(dur)}</span>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <button class="np-shuffle btn-icon w-9 h-9 ${shuffle ? 'active' : ''}" aria-label="Toggle shuffle" aria-pressed="${shuffle}">
        <span class="material-symbols-outlined">shuffle</span>
      </button>
      <button class="np-prev btn-icon w-9 h-9" aria-label="Previous">
        <span class="material-symbols-outlined text-2xl">skip_previous</span>
      </button>
      <button class="np-play-pause w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform" aria-label="Play/Pause">
        <span class="material-symbols-outlined text-3xl np-play-icon">${isPlaying ? 'pause' : 'play_arrow'}</span>
      </button>
      <button class="np-next btn-icon w-9 h-9" aria-label="Next">
        <span class="material-symbols-outlined text-2xl">skip_next</span>
      </button>
      <button class="np-repeat btn-icon w-9 h-9 ${repeat !== 'off' ? 'active' : ''}" aria-label="Toggle repeat" aria-pressed="${repeat !== 'off'}">
        <span class="material-symbols-outlined">${repeat === 'one' ? 'repeat_one' : 'repeat'}</span>
      </button>
    </div>

    <div class="flex items-center gap-3 w-full max-w-xs">
      <button class="np-mute btn-icon w-8 h-8" aria-label="Toggle mute" aria-pressed="${store.get('isMuted')}">
        <span class="material-symbols-outlined np-vol-icon">${store.get('isMuted') ? 'volume_off' : vol < 0.5 ? 'volume_down' : 'volume_up'}</span>
      </button>
      <input type="range" min="0" max="1" step="0.01" value="${vol}" class="np-volume flex-1" id="np-volume-bar" aria-label="Volume">
      <span class="text-xs text-slate-500 w-8 text-right tabular-nums" id="np-speed-label">${speed}x</span>
    </div>
  `;
}

function renderLyricsView() {
  const main = $('#np-main');
  if (!main) return;
  const song = store.get('currentSong');
  if (!song) return;

  main.innerHTML = `
    <div class="flex flex-col items-center justify-center py-8 px-4 text-center max-w-lg mx-auto min-h-full">
      <span class="material-symbols-outlined text-4xl text-slate-600 mb-4">lyrics</span>
      <h3 class="text-lg font-semibold text-white mb-2">Lyrics</h3>
      <p class="text-sm text-slate-500 leading-relaxed">
        Lyrics are not available for this track.
      </p>
      <p class="text-xs text-slate-600 mt-4">
        "${song.title}" by ${song.artist}
      </p>
      <div class="mt-6 w-full max-w-sm">
        <div class="bg-white/5 rounded-xl p-4 text-left">
          <p class="text-xs text-slate-500 italic leading-relaxed">
            AudioBytes doesn't have a lyrics provider integrated yet.
            <br><br>
            In a future update, lyrics will be fetched automatically and
            synced with the current playback position.
          </p>
        </div>
      </div>
    </div>
  `;
}

function updateNpRatingButtons() {
  const likeBtn = $('.np-like-btn');
  const dislikeBtn = $('.np-dislike-btn');
  const song = store.get('currentSong');
  if (!song) return;
  const isFav = store.getLikedIds().includes(song.id);
  const isDisliked = store.getDislikedIds().includes(song.id);
  if (likeBtn) {
    likeBtn.className = `np-like-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all ${isFav ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`;
    likeBtn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
    const icon = likeBtn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = isFav ? 'favorite' : 'favorite_border';
    const text = likeBtn.childNodes[2];
    if (text) text.textContent = isFav ? 'Liked' : 'Like';
  }
  if (dislikeBtn) {
    dislikeBtn.className = `np-dislike-btn inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm transition-all ${isDisliked ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`;
    dislikeBtn.setAttribute('aria-label', isDisliked ? 'Remove dislike' : 'Dislike');
    const icon = dislikeBtn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = isDisliked ? 'thumb_down' : 'thumb_down_off_alt';
    const text = dislikeBtn.childNodes[2];
    if (text) text.textContent = isDisliked ? 'Disliked' : 'Dislike';
  }
}

function bindNowPlayingEvents(overlay) {
  overlay.addEventListener('click', (e) => {
    if (e.target.closest('.np-close')) { closeNowPlaying(); return; }
    if (e.target.closest('.np-play-pause')) { player.toggle(); return; }
    if (e.target.closest('.np-prev')) { store.prev(); return; }
    if (e.target.closest('.np-next')) { store.next(); return; }
    if (e.target.closest('.np-shuffle')) { store.setState('shuffle', !store.get('shuffle')); return; }
    if (e.target.closest('.np-repeat')) {
      const modes = ['off', 'all', 'one'];
      const current = store.get('repeat');
      const next = modes[(modes.indexOf(current) + 1) % modes.length];
      store.setState('repeat', next);
      return;
    }
    if (e.target.closest('.np-mute')) { player.toggleMute(); return; }
    if (e.target.closest('.np-like-btn')) {
      const song = store.get('currentSong');
      if (!song) return;
      store.toggleFavorite(song.id);
      return;
    }
    if (e.target.closest('.np-dislike-btn')) {
      const song = store.get('currentSong');
      if (!song) return;
      store.toggleDislike(song.id);
      return;
    }
    if (e.target.closest('.np-view-toggle')) {
      const btn = e.target.closest('.np-view-toggle');
      const view = btn.dataset.view;
      document.querySelectorAll('.np-view-toggle').forEach(b => b.classList.toggle('active', b === btn));
      if (view === 'lyrics') renderLyricsView();
      else renderNowPlayingView();
      return;
    }
  });

  const progress = $('#np-progress-bar');
  if (progress) {
    let isSeeking = false;
    progress.addEventListener('input', () => {
      isSeeking = true;
      const time = (progress.value / 100) * store.get('duration');
      $('#np-current-time').textContent = formatTime(time);
    });
    progress.addEventListener('change', () => {
      const time = (progress.value / 100) * store.get('duration');
      player.seek(time);
      isSeeking = false;
    });
  }

  const volume = $('#np-volume-bar');
  if (volume) {
    volume.addEventListener('input', () => {
      player.setVolume(parseFloat(volume.value));
    });
  }

  let startY = 0;
  let startTranslate = 0;
  let isDragging = false;
  const dragContainer = overlay.querySelector('.fixed.inset-0');
  if (dragContainer) {
    dragContainer.addEventListener('touchstart', (e) => {
      if (e.target.closest('input, button, .np-view-toggle')) return;
      startY = e.touches[0].clientY;
      startTranslate = 0;
      isDragging = true;
      dragContainer.style.transition = 'none';
    }, { passive: true });

    dragContainer.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const dy = e.touches[0].clientY - startY;
      if (dy < 0) return;
      const translate = Math.min(dy * 0.5, 120);
      const opacity = 1 - (translate / 120);
      dragContainer.style.transform = `translateY(${translate}px)`;
      dragContainer.style.opacity = opacity;
    }, { passive: true });

    dragContainer.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      dragContainer.style.transition = 'transform 0.3s var(--easing), opacity 0.3s var(--easing)';
      const computed = parseFloat(dragContainer.style.transform?.replace('translateY(', '') || '0');
      if (computed > 80) {
        closeNowPlaying();
      } else {
        dragContainer.style.transform = 'translateY(0)';
        dragContainer.style.opacity = '1';
      }
    }, { passive: true });
  }
}

function updateNpPlayState() {
  const icon = $('.np-play-icon');
  if (icon) icon.textContent = store.get('isPlaying') ? 'pause' : 'play_arrow';
  const art = $('#np-art-container');
  if (art) art.classList.toggle('playing', store.get('isPlaying'));
}

function updateNpProgress() {
  const ct = $('#np-current-time');
  const bar = $('#np-progress-bar');
  const cur = store.get('currentTime');
  const dur = store.get('duration');
  if (ct) ct.textContent = formatTime(cur);
  if (bar && dur > 0) bar.value = (cur / dur) * 100;
}

function updateNpDuration() {
  const total = $('#np-total-time');
  if (total) total.textContent = formatTime(store.get('duration'));
}

function updateNpVolume() {
  const bar = $('#np-volume-bar');
  if (bar) bar.value = store.get('volume');
  const icon = $('.np-vol-icon');
  if (icon) icon.textContent = store.get('isMuted') ? 'volume_off' : store.get('volume') < 0.5 ? 'volume_down' : 'volume_up';
  const muteBtn = $('.np-mute');
  if (muteBtn) muteBtn.setAttribute('aria-pressed', String(store.get('isMuted')));
}

function updateNpShuffle() {
  const btn = $('.np-shuffle');
  if (btn) {
    const on = store.get('shuffle');
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  }
}

function updateNpRepeat() {
  const btn = $('.np-repeat');
  if (!btn) return;
  const mode = store.get('repeat');
  const isActive = mode !== 'off';
  btn.classList.toggle('active', isActive);
  btn.setAttribute('aria-pressed', String(isActive));
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = mode === 'one' ? 'repeat_one' : 'repeat';
}

function extractAvgColor(src) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    const overlay = $('#now-playing');
    if (overlay) {
      overlay.style.setProperty('--np-bg', `rgb(${r},${g},${b})`);
      overlay.querySelector('.fixed.inset-0.flex.flex-col').style.background = `rgb(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)})`;
    }
  };
}
