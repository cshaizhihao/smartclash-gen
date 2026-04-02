#!/usr/bin/env python3
import base64
import gzip
import json
import os
import subprocess
import zlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

try:
    import yaml
except Exception:
    yaml = None


def _split_flow_style_fields(text):
    fields = []
    buf = []
    depth = 0
    in_single = False
    in_double = False
    prev = ''
    for ch in text:
        if ch == "'" and not in_double and prev != '\\':
            in_single = not in_single
        elif ch == '"' and not in_single and prev != '\\':
            in_double = not in_double
        elif not in_single and not in_double:
            if ch in '{[':
                depth += 1
            elif ch in '}]' and depth > 0:
                depth -= 1
            elif ch == ',' and depth == 0:
                fields.append(''.join(buf).strip())
                buf = []
                prev = ch
                continue
        buf.append(ch)
        prev = ch
    if buf:
        fields.append(''.join(buf).strip())
    return fields


def _parse_flow_style_mapping(text):
    text = (text or '').strip()
    if text.startswith('{') and text.endswith('}'):
        text = text[1:-1]
    result = {}
    for item in _split_flow_style_fields(text):
        if ':' not in item:
            continue
        key, value = item.split(':', 1)
        key = key.strip().strip("'\"")
        value = value.strip().strip(',').strip()
        value = value.strip("'\"")
        result[key] = value
    return result

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
        if self.path.startswith('/api/health'):
            self._json(200, {
                'ok': True,
                'service': 'clash-smart-web',
                'version': VERSION_FILE.read_text(encoding='utf-8').strip() if VERSION_FILE.exists() else 'unknown',
                'subscriptionReady': PUBLISHED_FILE.exists(),
            })
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

    def _proxy_to_url(self, proxy, index=0):
        ptype = (proxy.get('type') or '').lower()
        name = quote(str(proxy.get('name') or f'node-{index+1}'))
        server = proxy.get('server') or '127.0.0.1'
        port = proxy.get('port') or 443
        if ptype == 'ss':
            cipher = proxy.get('cipher') or 'aes-128-gcm'
            password = proxy.get('password') or 'change-me'
            auth = base64.b64encode(f'{cipher}:{password}'.encode()).decode().rstrip('=')
            return f'ss://{auth}@{server}:{port}#{name}'
        if ptype == 'trojan':
            password = quote(str(proxy.get('password') or 'change-me'))
            sni = quote(str(proxy.get('sni') or proxy.get('servername') or server))
            return f'trojan://{password}@{server}:{port}?sni={sni}#{name}'
        if ptype == 'vless':
            uuid = proxy.get('uuid') or ''
            network = proxy.get('network') or 'tcp'
            tls = 'tls' if proxy.get('tls') else 'none'
            sni = quote(str(proxy.get('servername') or proxy.get('sni') or server))
            return f'vless://{uuid}@{server}:{port}?type={network}&security={tls}&sni={sni}#{name}'
        if ptype == 'vmess':
            payload = {
                'v': '2',
                'ps': proxy.get('name') or f'vmess-{index+1}',
                'add': server,
                'port': str(port),
                'id': proxy.get('uuid') or '',
                'aid': str(proxy.get('alterId') or 0),
                'scy': proxy.get('cipher') or 'auto',
                'net': proxy.get('network') or 'tcp',
                'type': 'none',
                'host': '',
                'path': '',
                'tls': 'tls' if proxy.get('tls') else '',
            }
            encoded = base64.b64encode(json.dumps(payload, ensure_ascii=False).encode()).decode()
            return f'vmess://{encoded}'
        return None

    def _extract_proxy_urls(self, text):
        txt = (text or '').strip()
        if not txt:
            return []

        candidates = [txt]
        try:
            data = base64.b64decode(txt + '===', validate=False).decode('utf-8', errors='ignore').strip()
            if data and data not in candidates:
                candidates.insert(0, data)
        except Exception:
            pass

        yaml_like_markers = ('proxies:', 'proxy-groups:', 'rules:', 'rule-providers:', 'port:', 'socks-port:', 'mixed-port:')

        for candidate in candidates:
            lines_only = [line.rstrip() for line in candidate.splitlines() if line.strip()]
            direct = [x.strip() for x in lines_only if x.strip().startswith(('vless://', 'vmess://', 'trojan://', 'ss://'))]
            if direct and len(direct) == len(lines_only):
                return direct

            is_yaml_like = any(marker in candidate for marker in yaml_like_markers)
            if yaml is not None:
                for loader_name in ('safe_load', 'full_load', 'unsafe_load'):
                    loader = getattr(yaml, loader_name, None)
                    if not loader:
                        continue
                    try:
                        obj = loader(candidate)
                        proxies = obj.get('proxies') if isinstance(obj, dict) else None
                        if isinstance(proxies, list):
                            lines = []
                            for i, proxy in enumerate(proxies):
                                if isinstance(proxy, dict):
                                    line = self._proxy_to_url(proxy, i)
                                    if line:
                                        lines.append(line)
                            if lines:
                                return lines
                    except Exception:
                        continue

            if is_yaml_like:
                in_proxies = False
                lines = []
                for raw_line in lines_only:
                    stripped = raw_line.strip()
                    if stripped == 'proxies:':
                        in_proxies = True
                        continue
                    if in_proxies and stripped.startswith(('proxy-groups:', 'rules:', 'rule-providers:')):
                        break
                    if in_proxies and stripped.startswith('- {') and stripped.endswith('}'):
                        proxy = _parse_flow_style_mapping(stripped[1:].strip())
                        line = self._proxy_to_url(proxy, len(lines))
                        if line:
                            lines.append(line)
                if lines:
                    return lines
                continue

            if direct:
                return direct

        return []

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
                    req = Request(url, headers={
                        'User-Agent': 'clash-verge/v1.7.7',
                        'Accept': '*/*',
                        'Accept-Encoding': 'gzip, deflate',
                        'Cache-Control': 'no-cache',
                        'subscription-userinfo': 'upload=0; download=0; total=0; expire=0',
                    })
                    with urlopen(req, timeout=12) as r:
                        body = r.read()
                        encoding = (r.headers.get('Content-Encoding') or '').lower()
                        if encoding == 'gzip':
                            body = gzip.decompress(body)
                        elif encoding == 'deflate':
                            body = zlib.decompress(body)
                        raw = body.decode('utf-8', errors='ignore')
                    lines = self._extract_proxy_urls(raw)
                    merged.extend(lines)
                    if not lines:
                        errors.append(f'{url}: 返回内容中没有识别到可导入节点')
                except Exception as e:
                    errors.append(f'{url}: {e}')

            placeholder_hits = 0
            for line in merged:
                lowered = line.lower()
                if ('不支持您的代理软件' in line or '请换用支持的代理软件' in line or '官网地址' in line or 'unsupported' in lowered):
                    placeholder_hits += 1

            self._json(200, {
                'ok': True,
                'count': len(merged),
                'lines': merged,
                'errors': errors[-10:],
                'placeholderOnly': bool(merged) and placeholder_hits == len(merged),
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
