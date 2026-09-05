export const APP_CONFIG = {
  name: 'AudioBytes',
  tagline: 'Your music, beautifully organized.',
  shortName: 'AudioBytes',
  description: 'A modern, elegant music streaming experience. Discover playlists, search your favorite songs, and enjoy premium audio.',
  version: '1.0.0',
  themeColor: '#E95420',
  backgroundColor: '#0F1115',
  brandColor: '#E95420',

  defaults: {
    volume: 0.7,
    playbackSpeed: 1,
    shuffle: false,
    repeat: 'off',
    viewMode: 'list',
    sortBy: 'default',
    crossfadeDuration: 2000
  },

  storage: {
    keys: {
      recentlyPlayed: 'audiobytes_recently_played',
      preferences: 'audiobytes_preferences',
      myPlaylists: 'audiobytes_my_playlists'
    }
  },

  search: {
    debounceMs: 200,
    maxResults: 20
  },

  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  }
};
