import http.server
import json
import os
import re
import shutil
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

PORT = 8899
CACHE = {}
LOCK = threading.Lock()
STREAM_TTL = 3600 * 6
CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stream-cache.json')
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36')


class _BadStream(Exception):
    pass


def load_cache():
    try:
        with open(CACHE_FILE) as f:
            data = json.load(f)
        for k, (url, expires) in data.items():
            if expires > time.time():
                CACHE[k] = (url, expires)
    except Exception:
        pass


def save_cache():
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(CACHE, f)
    except Exception:
        pass


def base_cmd():
    cmd = ['yt-dlp', '-f', 'bestaudio/best', '-g']
    if shutil.which('deno'):
        cmd.append('--js-runtimes')
        cmd.append('deno')
    return cmd


def resolve_stream(video_id):
    with LOCK:
        cached = CACHE.get(video_id)
        if cached and cached[1] > time.time():
            return cached[0]
    attempts = [base_cmd(), base_cmd()]
    for i, cmd in enumerate(attempts):
        try:
            result = subprocess.run(
                cmd + [f'https://www.youtube.com/watch?v={video_id}'],
                capture_output=True, text=True, timeout=30)
            url = next((line.strip() for line in reversed(result.stdout.splitlines())
                        if line.strip().startswith('http')), None)
            if url:
                with LOCK:
                    CACHE[video_id] = (url, time.time() + STREAM_TTL)
                save_cache()
                return url
        except Exception as e:
            print(f'[proxy] {video_id} attempt {i + 1}: {e!r}', flush=True)
        if i < len(attempts) - 1:
            time.sleep(2)
    return None


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/stream':
            video_id = urllib.parse.parse_qs(parsed.query).get('id', [''])[0]
            if not video_id:
                self._json({'error': 'missing id'}, 400)
                return
            if not resolve_stream(video_id):
                self._json({'error': 'no stream'}, 502)
                return
            self._json({'url': f'http://127.0.0.1:{PORT}/api/streamfile/{video_id}'})
            return
        if parsed.path.startswith('/api/streamfile/'):
            self._proxy_stream(parsed.path[len('/api/streamfile/'):])
            return
        return super().do_GET()

    def _fetch_range(self, url, range_hdr):
        headers = {'User-Agent': UA}
        if range_hdr:
            m = re.match(r'bytes=(\d+)-(?:(\d*))', range_hdr)
            if m and not m.group(2):
                start = int(m.group(1))
                headers['Range'] = f'bytes={start}-{start + 104857600}'
            else:
                headers['Range'] = range_hdr
        up = urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=20)
        ct = up.headers.get('Content-Type', '')
        if not ct.startswith(('audio/', 'video/')) and 'octet-stream' not in ct:
            up.close()
            raise _BadStream(f'non-media content-type: {ct}')
        return up

    def _proxy_stream(self, video_id):
        range_hdr = self.headers.get('Range')
        url = resolve_stream(video_id)
        if not url:
            self._json({'error': 'no stream'}, 502)
            return
        try:
            up = self._fetch_range(url, range_hdr)
        except (urllib.error.HTTPError, _BadStream) as e:
            if isinstance(e, urllib.error.HTTPError) and e.code not in (400, 403, 404, 410):
                up = None
            else:
                with LOCK:
                    CACHE.pop(video_id, None)
                save_cache()
                url = resolve_stream(video_id)
                try:
                    up = self._fetch_range(url, range_hdr)
                except Exception:
                    up = None
        except Exception:
            up = None
        if up is None:
            self._json({'error': 'no stream'}, 502)
            return
        with up:
            self.send_response(up.status)
            for h in ('Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges', 'ETag', 'Last-Modified'):
                if up.headers.get(h):
                    self.send_header(h, up.headers[h])
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            while True:
                chunk = up.read(65536)
                if not chunk:
                    break
                self.wfile.write(chunk)

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    load_cache()
    http.server.ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
