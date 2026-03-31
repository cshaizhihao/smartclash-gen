#!/usr/bin/env python3
import argparse
import base64
import json
import re
import uuid
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
from urllib.request import Request, urlopen

import yaml

VERSION = "0.3.0"

DEFAULT_RULE_PROVIDERS = {
    "BanAD": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/BanAD.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/BanAD.list", "interval": 86400
    },
    "BanProgramAD": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/BanProgramAD.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/BanProgramAD.list", "interval": 86400
    },
    "ChinaCompanyIp": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/ChinaCompanyIp.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ChinaCompanyIp.list", "interval": 86400
    },
    "ChinaDomain": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/ChinaDomain.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ChinaDomain.list", "interval": 86400
    },
    "Gemini": {
        "type": "http", "behavior": "classical", "path": "./ruleset/Gemini.yaml", "url": "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Gemini/Gemini.yaml", "interval": 86400
    },
    "GoogleCN": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/GoogleCN.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/GoogleCN.list", "interval": 86400
    },
    "LocalAreaNetwork": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/LocalAreaNetwork.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/LocalAreaNetwork.list", "interval": 86400
    },
    "Netflix": {
        "type": "http", "behavior": "classical", "path": "./ruleset/Netflix.yaml", "url": "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix.yaml", "interval": 86400
    },
    "ProxyLite": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/ProxyLite.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ProxyLite.list", "interval": 86400
    },
    "ProxyMedia": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/ProxyMedia.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ProxyMedia.list", "interval": 86400
    },
    "SteamCN": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/SteamCN.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Ruleset/SteamCN.list", "interval": 86400
    },
    "Telegram": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/Telegram.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Telegram.list", "interval": 86400
    },
    "UnBan": {
        "type": "http", "behavior": "classical", "format": "text", "path": "./providers/UnBan.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/UnBan.list", "interval": 86400
    },
    "category-ai-!cn": {
        "type": "http", "format": "mrs", "behavior": "domain", "url": "https://gh-proxy.com/https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ai-!cn.mrs", "path": "./ruleset/category-ai-!cn.mrs", "interval": 86400
    },
    "openai": {
        "type": "http", "format": "mrs", "behavior": "domain", "url": "https://gh-proxy.com/https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/openai.mrs", "path": "./ruleset/openai.mrs", "interval": 86400
    }
}


def b64_decode(s: str) -> str:
    s = s.strip()
    s += '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s.encode()).decode(errors='ignore')


def parse_vmess(line: str, idx: int):
    raw = line[len('vmess://'):]
    try:
        data = json.loads(b64_decode(raw))
    except Exception:
        return None
    name = data.get('ps') or f'vmess-{idx}'
    return {
        'name': name,
        'type': 'vmess',
        'server': data.get('add'),
        'port': int(data.get('port', 443)),
        'uuid': data.get('id'),
        'alterId': int(data.get('aid', 0)),
        'cipher': data.get('scy', 'auto'),
        'tls': (data.get('tls') == 'tls'),
        'network': data.get('net', 'tcp'),
        'ws-opts': {'path': data.get('path', '/'), 'headers': {'Host': data.get('host', '')}} if data.get('net') == 'ws' else None,
        'servername': data.get('sni') or None,
        'skip-cert-verify': True,
    }


def parse_vless(line: str, idx: int):
    u = urlparse(line)
    q = parse_qs(u.query)
    name = unquote(u.fragment) or f'vless-{idx}'
    out = {
        'name': name,
        'type': 'vless',
        'server': u.hostname,
        'port': int(u.port or 443),
        'uuid': u.username,
        'udp': True,
        'tls': q.get('security', [''])[0] in ('tls', 'reality'),
        'network': q.get('type', ['tcp'])[0],
        'servername': q.get('sni', [''])[0] or None,
        'skip-cert-verify': True,
    }
    if out['network'] == 'ws':
        out['ws-opts'] = {
            'path': q.get('path', ['/'])[0],
            'headers': {'Host': q.get('host', [''])[0] or q.get('sni', [''])[0]}
        }
    if q.get('security', [''])[0] == 'reality':
        out['reality-opts'] = {'public-key': q.get('pbk', [''])[0], 'short-id': q.get('sid', [''])[0]}
        out['client-fingerprint'] = q.get('fp', ['chrome'])[0]
    return out


def parse_trojan(line: str, idx: int):
    u = urlparse(line)
    q = parse_qs(u.query)
    name = unquote(u.fragment) or f'trojan-{idx}'
    out = {
        'name': name,
        'type': 'trojan',
        'server': u.hostname,
        'port': int(u.port or 443),
        'password': u.username,
        'sni': q.get('sni', [''])[0] or u.hostname,
        'skip-cert-verify': True,
        'udp': True,
    }
    if q.get('type', ['tcp'])[0] == 'ws':
        out['network'] = 'ws'
        out['ws-opts'] = {'path': q.get('path', ['/'])[0], 'headers': {'Host': q.get('host', [''])[0] or q.get('sni', [''])[0]}}
    return out


def parse_ss(line: str, idx: int):
    u = urlparse(line)
    name = unquote(u.fragment) or f'ss-{idx}'
    method = password = None
    if u.username and ':' in u.username:
        method, password = u.username.split(':', 1)
    elif u.username:
        try:
            method, password = b64_decode(u.username).split(':', 1)
        except Exception:
            pass
    return {'name': name, 'type': 'ss', 'server': u.hostname, 'port': int(u.port or 443), 'cipher': method or 'aes-128-gcm', 'password': password or str(uuid.uuid4()), 'udp': True}


def clean_proxy(p: dict):
    return {k: v for k, v in p.items() if v is not None}


def parse_urls(lines):
    proxies = []
    for i, raw in enumerate(lines, 1):
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        p = None
        if line.startswith('vmess://'):
            p = parse_vmess(line, i)
        elif line.startswith('vless://'):
            p = parse_vless(line, i)
        elif line.startswith('trojan://'):
            p = parse_trojan(line, i)
        elif line.startswith('ss://'):
            p = parse_ss(line, i)
        if p:
            proxies.append(clean_proxy(p))
    return proxies


def maybe_decode_subscription(text: str) -> list[str]:
    raw = text.strip()
    if not raw:
        return []

    # plain list already
    if '://' in raw and '\n' in raw:
        return [x.strip() for x in raw.splitlines() if x.strip()]

    # try base64 subscription blob
    try:
        decoded = b64_decode(raw)
        if '://' in decoded:
            return [x.strip() for x in decoded.splitlines() if x.strip()]
    except Exception:
        pass

    # fallback as single line
    return [raw]


def fetch_subscription_lines(sub_url: str) -> list[str]:
    req = Request(sub_url, headers={'User-Agent': 'smartclash-gen/0.3.0'})
    with urlopen(req, timeout=20) as resp:
        body = resp.read().decode('utf-8', errors='ignore')
    return maybe_decode_subscription(body)


def parse_rules(lines):
    out = []
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        parts = [x.strip() for x in line.split(',')]
        if len(parts) == 1:
            out.append({'type': 'MATCH', 'payload': '', 'group': 'Smart-AUTO'})
        elif len(parts) == 2:
            out.append({'type': parts[0], 'payload': parts[1], 'group': 'Smart-AUTO'})
        else:
            # keep extra flags such as no-resolve
            out.append({'type': parts[0], 'payload': parts[1], 'group': parts[2] or 'Smart-AUTO', 'extra': parts[3:]})
    return out


def to_rule_line(rule: dict) -> str:
    if rule['type'] == 'MATCH':
        return 'MATCH,Smart-AUTO'
    base = [rule['type'], rule['payload'], rule['group']]
    base.extend(rule.get('extra', []))
    return ','.join(base)


def build_config(proxies, rules, port):
    names = [p['name'] for p in proxies]
    cfg = {
        'mixed-port': int(port),
        'allow-lan': True,
        'mode': 'rule',
        'log-level': 'info',
        'external-controller': ':9090',
        'ipv6': False,
        'keep-alive-interval': 15,
        'tcp-concurrent': True,
        'unified-delay': True,
        'proxies': proxies,
        'rule-providers': DEFAULT_RULE_PROVIDERS,
        'dns': {
            'enable': True,
            'enhanced-mode': 'redir-host'
        },
        'proxy-groups': [
            {
                'name': 'Smart-AUTO',
                'type': 'smart',
                'proxies': names,
                'policy-priority': 'HK|Hong\\s?Kong|香港:1.2;SG|Singapore|新加坡:1.2;JP|Japan|日本:1.1;US|America|United\\s?States|美国:1.0',
                'prefer-asn': True,
                'sample-rate': 1,
                'collectdata': False,
                'uselightgbm': False,
            },
            {'name': 'Smart-HK', 'type': 'smart', 'proxies': [n for n in names if re.search(r'HK|Hong\\s?Kong|香港', n, re.I)] or names, 'prefer-asn': True},
            {'name': 'Smart-SG', 'type': 'smart', 'proxies': [n for n in names if re.search(r'SG|Singapore|新加坡', n, re.I)] or names, 'prefer-asn': True},
            {'name': 'Smart-JP', 'type': 'smart', 'proxies': [n for n in names if re.search(r'JP|Japan|日本', n, re.I)] or names, 'prefer-asn': True},
            {'name': 'DIRECT', 'type': 'select', 'proxies': ['DIRECT']},
        ],
        'rules': [to_rule_line(r) for r in rules] + [
            'RULE-SET,BanAD,DIRECT',
            'RULE-SET,LocalAreaNetwork,DIRECT',
            'RULE-SET,Telegram,Smart-AUTO',
            'RULE-SET,Netflix,Smart-AUTO',
            'RULE-SET,openai,Smart-AUTO',
            'RULE-SET,category-ai-!cn,Smart-AUTO',
            'MATCH,Smart-AUTO',
        ]
    }
    return cfg


def main():
    ap = argparse.ArgumentParser(description='smartclash-gen v0.3.0')
    ap.add_argument('--urls', help='urls.txt path (one url per line)')
    ap.add_argument('--sub-url', action='append', default=[], help='subscription url, can repeat')
    ap.add_argument('--sub-file', help='file contains subscription urls, one per line')
    ap.add_argument('--rules', help='rules/rul path')
    ap.add_argument('--port', type=int, default=7892, help='mixed-port')
    ap.add_argument('--output', default='openclash.yaml', help='output yaml file')
    args = ap.parse_args()

    url_lines = []
    if args.urls and Path(args.urls).exists():
        url_lines.extend(Path(args.urls).read_text(encoding='utf-8', errors='ignore').splitlines())

    sub_urls = list(args.sub_url or [])
    if args.sub_file and Path(args.sub_file).exists():
        sub_urls.extend([x.strip() for x in Path(args.sub_file).read_text(encoding='utf-8', errors='ignore').splitlines() if x.strip()])

    for su in sub_urls:
        try:
            url_lines.extend(fetch_subscription_lines(su))
        except Exception as e:
            print(f'[WARN] failed sub-url: {su} -> {e}')

    # 去重，保持顺序
    dedup = []
    seen = set()
    for line in url_lines:
        t = line.strip()
        if t and t not in seen:
            seen.add(t)
            dedup.append(t)

    proxies = parse_urls(dedup)
    if not proxies:
        raise SystemExit('No valid urls parsed (check --urls / --sub-url / --sub-file).')

    rules = []
    if args.rules and Path(args.rules).exists():
        lines = Path(args.rules).read_text(encoding='utf-8', errors='ignore').splitlines()
        rules = parse_rules(lines)

    cfg = build_config(proxies, rules, args.port)
    out = Path(args.output)
    yml = yaml.safe_dump(cfg, sort_keys=False, allow_unicode=True)
    out.write_text(yml, encoding='utf-8')
    out.with_suffix('.md').write_text(f"# smartclash-gen v{VERSION}\n\n```yaml\n{yml}\n```\n", encoding='utf-8')
    print(f'Generated {out} and {out.with_suffix(".md")}')


if __name__ == '__main__':
    main()
