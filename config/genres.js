export const GENRE_GROUPS = [
  {
    id: 'blues',
    name: 'Blues',
    description: 'All playlists — from Delta blues and Chicago soul to rock, jazz, funk, and beyond.',
    icon: 'music_note',
    playlists: [
      'blues-classics', 'chicago-blues', 'delta-blues', 'texas-blues', 'british-blues',
      'electric-blues', 'acoustic-blues', 'blues-rock', 'soul-blues', 'contemporary-blues',
      'blues-ballads', 'blues-guitar-legends', 'live-blues', 'americana-blues', 'blues-jam-sessions',
      'rock-essentials', 'jazz-standards', 'soul-classics', 'funk-grooves', 'rnb-hits'
    ]
  },
  {
    id: 'rock',
    name: 'Rock',
    description: 'From 50s rock & roll to grunge and beyond — the 15 essential subgenres of rock.',
    icon: 'electric_bolt',
    playlists: [
      'classic-rock', 'hard-rock', 'heavy-metal', 'psychedelic-rock', 'progressive-rock',
      'blues-rock', 'southern-rock', 'glam-rock', 'punk-rock', 'new-wave',
      'grunge', 'alternative-rock', 'britpop', 'nu-metal', 'garage-rock'
    ]
  }
];

export function getPlaylistsForGroup(groupId, allPlaylists) {
  const group = GENRE_GROUPS.find(g => g.id === groupId);
  if (!group) return [];
  return allPlaylists.filter(pl => group.playlists.includes(pl.id));
}

export function getGroupForPlaylist(playlistId) {
  return GENRE_GROUPS.find(g => g.playlists.includes(playlistId)) || null;
}
