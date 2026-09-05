import { store } from '../js/store.js';

export function startRadioPlaylist(playlistId) {
  const pl = store.getPlaylist(playlistId);
  if (!pl) return;

  const disliked = store.getDislikedIds();
  const songs = pl.songs
    .filter(s => !disliked.includes(s.id))
    .map((s, i) => ({
      ...s,
      playlistId,
      playlistName: pl.name,
      playlistCover: pl.cover
    }));

  const shuffled = [...songs].sort(() => Math.random() - 0.5);
  store.playFromQueue(shuffled, 0);
  store.setState('shuffle', true);
  import('./toast.js').then(m => m.showToast(`Starting radio: ${pl.name}`));
}

export function startRadioSong(songId, playlistId) {
  const pl = store.getPlaylist(playlistId);
  if (!pl) return;

  const disliked = store.getDislikedIds();
  const similar = pl.songs.filter(s => {
    if (s.id === songId) return false;
    if (disliked.includes(s.id)) return false;
    const target = pl.songs.find(x => x.id === songId);
    if (!target) return false;
    return s.genre === target.genre || s.artist === target.artist;
  });

  const target = pl.songs.find(x => x.id === songId);
  const seed = target ? [{ ...target, playlistId, playlistName: pl.name, playlistCover: pl.cover }] : [];
  const rest = similar.map(s => ({ ...s, playlistId, playlistName: pl.name, playlistCover: pl.cover }));
  const queue = [...seed, ...rest.sort(() => Math.random() - 0.5)];

  if (!queue.length) {
    startRadioPlaylist(playlistId);
    return;
  }

  store.playFromQueue(queue, 0);
  store.setState('shuffle', true);
  import('./toast.js').then(m => m.showToast(`Starting radio from song`));
}
