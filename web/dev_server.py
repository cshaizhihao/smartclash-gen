#!/usr/bin/env python3
import json
import os
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
VERSION_FILE = PROJECT_ROOT / 'VERSION'
INSTALL_SH = PROJECT_ROOT / 'install.sh'
DEFAULT_TARGET = os.path.expanduser('~/.smartclash-gen')


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
        return super().do_GET()

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
        self._json(404, {'ok': False, 'error': 'not found'})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '10100'))
    host = os.environ.get('HOST', '0.0.0.0')
    print(f'serving on http://{host}:{port}')
    ThreadingHTTPServer((host, port), Handler).serve_forever()
