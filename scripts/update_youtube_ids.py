import json
import subprocess
import os
import concurrent.futures

DATA_FILE = 'data/playlists.json'

def get_official_audio_id(artist, title):
    query = f"ytsearch1:{artist} {title} official audio"
    try:
        # Run yt-dlp to get just the ID
        result = subprocess.run(
            ['yt-dlp', query, '--get-id'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip().split('\n')[0] # get first id just in case
    except subprocess.CalledProcessError as e:
        print(f"Error fetching ID for {artist} - {title}: {e.stderr}")
        return None

def process_song(song):
    artist = song.get('artist', '')
    title = song.get('title', '')
    if not artist or not title:
        return song
    
    print(f"Searching for: {artist} - {title}")
    new_id = get_official_audio_id(artist, title)
    
    if new_id:
        print(f"Found new ID for {artist} - {title}: {new_id} (old: {song.get('youtube_id')})")
        song['youtube_id'] = new_id
    else:
        print(f"Failed to find ID for {artist} - {title}")
    
    return song

def main():
    if not os.path.exists(DATA_FILE):
        print(f"File not found: {DATA_FILE}")
        return

    with open(DATA_FILE, 'r') as f:
        playlists = json.load(f)

    all_songs = []
    for p in playlists:
        for s in p.get('songs', []):
            all_songs.append(s)
            
    print(f"Starting ID fetch for {len(all_songs)} songs using 10 workers...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_song, song): song for song in all_songs}
        for future in concurrent.futures.as_completed(futures):
            future.result()

    with open(DATA_FILE, 'w') as f:
        json.dump(playlists, f, indent=2)

    print("Successfully updated playlists.json!")

if __name__ == '__main__':
    main()
