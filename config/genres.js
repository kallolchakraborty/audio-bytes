export const GENRE_GROUPS = [
  {
    id: 'regional-blues',
    name: 'Regional Blues',
    description: 'Blues born from geography — each region brought its own sound, feel, and story.',
    icon: 'map',
    playlists: ['chicago-blues', 'delta-blues', 'texas-blues', 'british-blues']
  },
  {
    id: 'blues-styles',
    name: 'Blues Styles',
    description: 'Different approaches to the blues — from raw acoustic to electric, soulful, and modern.',
    icon: 'music_note',
    playlists: ['electric-blues', 'acoustic-blues', 'blues-rock', 'soul-blues', 'contemporary-blues', 'blues-ballads']
  },
  {
    id: 'blues-collections',
    name: 'Blues Collections',
    description: 'Curated sets — live recordings, guitar legends, jam sessions, and timeless classics.',
    icon: 'album',
    playlists: ['blues-classics', 'blues-guitar-legends', 'live-blues', 'americana-blues', 'blues-jam-sessions']
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
