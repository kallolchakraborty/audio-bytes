# AudioBytes

A production-quality music streaming website with a persistent bottom player, dynamic playlist pages, global search, and PWA support.

Inspired by the design aesthetic of [ai-bytes](https://kallolchakraborty.github.io/ai-bytes/).

## Quick Start

```bash
npm install
npm run build:css
npx serve .
```

Open `http://localhost:3000` in your browser.

## Architecture

```
index.html          — App shell (header, main, player)
├── config/app.js   — Centralized configuration
├── data/playlists.json — All playlist/song data
├── css/
│   ├── main.css    — Design tokens, glassmorphism, animations
│   └── tailwind.css — Compiled Tailwind utility classes
├── js/
│   ├── app.js      — Entry point, orchestrator
│   ├── store.js    — Singleton state (pub/sub pattern)
│   ├── router.js   — Hash-based SPA routing
│   ├── player.js   — Audio engine (YouTube IFrame API)
│   ├── ui.js       — DOM helpers (render, animate, transitions)
│   └── utils.js    — Debounce, format, throttle, DOM queries
├── components/
│   ├── header.js       — Sticky glass nav + auto playlist links
│   ├── home.js         — Hero + featured + recently played
│   ├── song-card.js    — Grid/list song rendering
│   ├── playlist-view.js — Playlist page with sort/filter/search
│   ├── player-bar.js   — Persistent bottom player UI
│   ├── search-modal.js — Ctrl+K command palette
│   ├── toast.js        — Notification system
│   ├── context-menu.js — Right-click menu
│   ├── skeleton.js     — Loading states
│   └── equalizer.js    — Animated play indicator
├── sw.js           — Service worker (cache-first static)
├── manifest.json   — PWA manifest
└── assets/
    ├── icons/      — App icons (32, 192, 512 PNG)
    └── images/     — SVGs (favicon, fallback, og-image)
```

## Features

### Player
- Persistent bottom bar with play/pause, next/prev, shuffle, repeat
- Progress bar with seek, volume control, mute
- Playback speed (0.25x–2x via +/- keys)
- Equalizer animation (4 bars synced to play state)
- Keyboard shortcuts: Space (play/pause), ←/→ (prev/next), ↑/↓ (volume), M (mute), S (shuffle), R (repeat)

### Playlists
- 15 pre-loaded blues playlists with 20 songs each (300 total)
- Home page: hero section, featured playlists, recently played
- Playlist page: grid/list toggle, search within playlist, sort (title/artist/year/duration)
- Play All and Shuffle buttons

### Search
- Ctrl+K command palette with debounced search
- Searches songs, artists, albums, and playlists
- Fuzzy matching with keyboard navigation (↑↓)

### Navigation
- Header auto-lists all playlists from JSON
- Mobile hamburger menu
- Hash-based SPA routing: `#/`, `#/playlist/:id`

### PWA
- Installable via manifest + service worker
- Cache-first static assets, network-first data
- Offline fallback page (404.html)
- Theme color, splash screen support

### UX
- Skeleton loading screens
- Toast notifications (info/success/error/warning)
- Scroll progress indicator on top
- Back-to-top floating button
- Context menu (right-click) on songs
- Touch swipe gestures for prev/next
- Reduced motion support
- Skip-to-content accessibility link
- Semantic HTML with ARIA labels

## Adding a Playlist

Edit `data/playlists.json`:

```json
{
  "id": "my-playlist",
  "name": "My Playlist",
  "description": "Description here",
  "cover": "assets/images/my-cover.svg",
  "color": "#FF5733",
  "songs": [
    {
      "id": "s1",
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "year": 2024,
      "duration": "3:45",
      "youtube_id": "VIDEO_ID",
      "genre": "Pop"
    }
  ]
}
```

The header and home page will update automatically.

## YouTube Integration

Audio playback uses the YouTube IFrame Player API (hidden 0×0 player). Metadata is fetched via the YouTube oEmbed endpoint.

## Building CSS

```bash
npm run build:css
```

## Performance Notes

- System font stack (no external font downloads)
- Material Symbols loaded with `font-display: block` and `preconnect`
- GPU-accelerated animations (transform/opacity only)
- Lazy-loaded images with `loading="lazy"` and `decoding="async"`
- Deferred ES module loading with dynamic `import()`
- Minimal DOM updates via DocumentFragment
- `content-visibility: auto` ready (add per section)
- Service worker for aggressive caching

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← → | Previous/Next |
| ↑ ↓ | Volume +/- |
| M | Mute toggle |
| S | Shuffle toggle |
| R | Repeat toggle |
| + / - | Speed up/down |
| Ctrl+K | Search |
| Esc | Close modal/menu |

## Project Structure

```
audiobytes/
├── index.html
├── manifest.json
├── sw.js
├── robots.txt
├── sitemap.xml
├── 404.html
├── tailwind.config.cjs
├── package.json
├── config/
├── data/
├── css/
├── js/
├── components/
└── assets/
```

## License

MIT
