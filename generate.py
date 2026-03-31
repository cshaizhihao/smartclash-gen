#!/usr/bin/env python3
import argparse
import base64
import json
import re
import uuid
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote

import yaml


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
        out['reality-opts'] = {
            'public-key': q.get('pbk', [''])[0],
            'short-id': q.get('sid', [''])[0],
        }
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
        out['ws-opts'] = {
            'path': q.get('path', ['/'])[0],
            'headers': {'Host': q.get('host', [''])[0] or q.get('sni', [''])[0]}
        }
    return out


def parse_ss(line: str, idx: int):
    # supports ss://base64(method:password)@host:port#name
    u = urlparse(line)
    name = unquote(u.fragment) or f'ss-{idx}'
    method = password = None
    host = u.hostname
    port = u.port

    if u.username and ':' in u.username:
        method, password = u.username.split(':', 1)
    elif u.username:
        try:
            d = b64_decode(u.username)
            method, password = d.split(':', 1)
        except Exception:
            pass

    return {
        'name': name,
        'type': 'ss',
        'server': host,
        'port': int(port or 443),
        'cipher': method or 'aes-128-gcm',
        'password': password or str(uuid.uuid4()),
        'udp': True,
    }


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


def parse_rules(lines):
    items = []
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        parts = [x.strip() for x in line.split(',')]
        if len(parts) == 1:
            items.append({'type': 'MATCH', 'value': '', 'group': 'Smart-AUTO'})
            continue
        if len(parts) == 2:
            items.append({'type': parts[0], 'value': parts[1], 'group': 'Smart-AUTO'})
            continue
        items.append({'type': parts[0], 'value': parts[1], 'group': parts[2] or 'Smart-AUTO'})
    return items


def mk_rule_line(r):
    if r['type'] == 'MATCH':
        return 'MATCH,Smart-AUTO'
    return f"{r['type']},{r['value']},{r['group']}"


def build_config(proxies, rules, port):
    names = [p['name'] for p in proxies]
    cfg = {
        'mixed-port': int(port),
        'allow-lan': True,
        'mode': 'rule',
        'log-level': 'info',
        'external-controller': '127.0.0.1:9090',
        'proxies': proxies,
        'proxy-groups': [
            {
                'name': 'Smart-AUTO',
                'type': 'smart',
                'proxies': names,
                'policy-priority': 'HK|Hong\s?Kong:1.2;SG|Singapore:1.2;JP|Japan:1.1;US|America|United\s?States:1.0',
                'prefer-asn': True,
                'sample-rate': 1,
                'collectdata': False,
                'uselightgbm': False,
            },
            {
                'name': 'Smart-HK',
                'type': 'smart',
                'proxies': [n for n in names if re.search(r'HK|Hong\\s?Kong|香港', n, re.I)] or names,
                'prefer-asn': True,
            },
            {
                'name': 'Smart-SG',
                'type': 'smart',
                'proxies': [n for n in names if re.search(r'SG|Singapore|新加坡', n, re.I)] or names,
                'prefer-asn': True,
            },
            {
                'name': 'Smart-JP',
                'type': 'smart',
                'proxies': [n for n in names if re.search(r'JP|Japan|日本', n, re.I)] or names,
                'prefer-asn': True,
            },
            {
                'name': 'DIRECT',
                'type': 'select',
                'proxies': ['DIRECT']
            }
        ],
        'rules': [mk_rule_line(r) for r in rules] + ['MATCH,Smart-AUTO']
    }
    return cfg


def main():
    ap = argparse.ArgumentParser(description='Generate editable mihomo/OpenClash YAML from URLs + rules')
    ap.add_argument('--urls', required=True, help='Path to urls.txt (one URL per line)')
    ap.add_argument('--rules', required=False, help='Path to rul/rules.txt (one rule per line)')
    ap.add_argument('--port', type=int, default=7890, help='mixed-port')
    ap.add_argument('--output', default='output.yaml', help='output yaml path')
    args = ap.parse_args()

    url_lines = Path(args.urls).read_text(encoding='utf-8', errors='ignore').splitlines()
    proxies = parse_urls(url_lines)
    if not proxies:
        raise SystemExit('No valid URLs parsed.')

    rules = []
    if args.rules and Path(args.rules).exists():
        rule_lines = Path(args.rules).read_text(encoding='utf-8', errors='ignore').splitlines()
        rules = parse_rules(rule_lines)

    cfg = build_config(proxies, rules, args.port)
    out = Path(args.output)
    out.write_text(yaml.safe_dump(cfg, sort_keys=False, allow_unicode=True), encoding='utf-8')

    md = f"""# 生成结果\n\n```yaml\n{yaml.safe_dump(cfg, sort_keys=False, allow_unicode=True)}\n```\n"""
    Path(out.with_suffix('.md')).write_text(md, encoding='utf-8')
    print(f'Generated: {out} and {out.with_suffix(".md")}')


if __name__ == '__main__':
    main()
