#!/usr/bin/env python3
import base64
import json
import os
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
VERSION_FILE = PROJECT_ROOT / 'VERSION'
INSTALL_SH = PROJECT_ROOT / 'install.sh'
DEFAULT_TARGET = os.path.expanduser('~/.smartclash-gen')
PUBLISHED_DIR = ROOT / 'published'
PUBLISHED_FILE = PUBLISHED_DIR / 'latest.yaml'


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _latest_version(self):
        try:
            with urlopen('https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main/VERSION', timeout=8) as r:
                return r.read().decode('utf-8').strip()
        except Exception:
            return None

    def do_GET(self):
        if self.path.startswith('/api/version'):
            local = VERSION_FILE.read_text(encoding='utf-8').strip() if VERSION_FILE.exists() else 'unknown'
            latest = self._latest_version()
            self._json(200, {'ok': True, 'local': local, 'latest': latest})
            return
        if self.path.startswith('/sub/latest'):
            if not PUBLISHED_FILE.exists():
                self.send_error(404, 'subscription not generated yet')
                return
            data = PUBLISHED_FILE.read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'application/x-yaml; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        return super().do_GET()

    def _read_json_body(self):
        size = int(self.headers.get('Content-Length', '0') or 0)
        raw = self.rfile.read(size) if size > 0 else b'{}'
        try:
            return json.loads(raw.decode('utf-8'))
        except Exception:
            return {}

    def _normalize_sub_text(self, text):
        txt = (text or '').strip()
        if not txt:
            return ''
        if '://' in txt and ('\n' in txt or txt.startswith('vless://') or txt.startswith('vmess://') or txt.startswith('trojan://') or txt.startswith('ss://')):
            return txt
        try:
            data = base64.b64decode(txt + '===', validate=False).decode('utf-8', errors='ignore')
            if '://' in data:
                return data
        except Exception:
            pass
        return txt

    def do_POST(self):
        if self.path.startswith('/api/update'):
            cmd = ['bash', str(INSTALL_SH), '--update', '-d', DEFAULT_TARGET]
            try:
                proc = subprocess.run(cmd, cwd=str(PROJECT_ROOT), capture_output=True, text=True, timeout=120)
                local = VERSION_FILE.read_text(encoding='utf-8').strip() if VERSION_FILE.exists() else 'unknown'
                self._json(200, {
                    'ok': proc.returncode == 0,
                    'code': proc.returncode,
                    'local': local,
                    'stdout': (proc.stdout or '')[-800:],
                    'stderr': (proc.stderr or '')[-800:],
                })
            except Exception as e:
                self._json(500, {'ok': False, 'error': str(e)})
            return

        if self.path.startswith('/api/subscriptions/fetch'):
            body = self._read_json_body()
            urls = body.get('urls') or []
            if not isinstance(urls, list):
                return self._json(400, {'ok': False, 'error': 'urls must be array'})

            merged = []
            errors = []
            for u in urls[:10]:
                url = (u or '').strip()
                if not url.startswith(('http://', 'https://')):
                    continue
                try:
                    req = Request(url, headers={'User-Agent': 'smartclash-gen/1.0'})
                    with urlopen(req, timeout=12) as r:
                        raw = r.read().decode('utf-8', errors='ignore')
                    txt = self._normalize_sub_text(raw)
                    lines = [x.strip() for x in txt.splitlines() if '://' in x]
                    merged.extend(lines)
                except Exception as e:
                    errors.append(f'{url}: {e}')

            self._json(200, {
                'ok': True,
                'count': len(merged),
                'lines': merged,
                'errors': errors[-10:],
            })
            return

        if self.path.startswith('/api/subscription/publish'):
            body = self._read_json_body()
            yaml_text = (body.get('yaml') or '').strip()
            if not yaml_text:
                return self._json(400, {'ok': False, 'error': 'yaml is required'})
            PUBLISHED_DIR.mkdir(parents=True, exist_ok=True)
            PUBLISHED_FILE.write_text(yaml_text, encoding='utf-8')
            host = self.headers.get('X-Forwarded-Host') or self.headers.get('Host') or f'127.0.0.1:{os.environ.get("PORT", "10100")}'
            proto = self.headers.get('X-Forwarded-Proto') or 'http'
            url = f'{proto}://{host}/sub/latest'
            self._json(200, {'ok': True, 'url': url})
            return

        self._json(404, {'ok': False, 'error': 'not found'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '10100'))
    host = os.environ.get('HOST', '0.0.0.0')
    print(f'serving on http://{host}:{port}')
    ThreadingHTTPServer((host, port), Handler).serve_forever()
