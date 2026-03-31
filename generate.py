#!/usr/bin/env python3
import argparse
import base64
import json
import re
import sys
import uuid
import shutil
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse
from urllib.request import Request, urlopen

import yaml

VERSION = "0.5.0"

EXIT_OK = 0
EXIT_WARN = 10
EXIT_FAIL = 1

DEFAULT_RULE_PROVIDERS = {
    "BanAD": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/BanAD.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/BanAD.list", "interval": 86400},
    "BanProgramAD": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/BanProgramAD.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/BanProgramAD.list", "interval": 86400},
    "ChinaCompanyIp": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/ChinaCompanyIp.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ChinaCompanyIp.list", "interval": 86400},
    "ChinaDomain": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/ChinaDomain.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ChinaDomain.list", "interval": 86400},
    "Gemini": {"type": "http", "behavior": "classical", "path": "./ruleset/Gemini.yaml", "url": "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Gemini/Gemini.yaml", "interval": 86400},
    "GoogleCN": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/GoogleCN.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/GoogleCN.list", "interval": 86400},
    "LocalAreaNetwork": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/LocalAreaNetwork.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/LocalAreaNetwork.list", "interval": 86400},
    "Netflix": {"type": "http", "behavior": "classical", "path": "./ruleset/Netflix.yaml", "url": "https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix.yaml", "interval": 86400},
    "ProxyLite": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/ProxyLite.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ProxyLite.list", "interval": 86400},
    "ProxyMedia": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/ProxyMedia.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ProxyMedia.list", "interval": 86400},
    "SteamCN": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/SteamCN.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Ruleset/SteamCN.list", "interval": 86400},
    "Telegram": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/Telegram.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Telegram.list", "interval": 86400},
    "UnBan": {"type": "http", "behavior": "classical", "format": "text", "path": "./providers/UnBan.txt", "url": "https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/UnBan.list", "interval": 86400},
    "category-ai-!cn": {"type": "http", "format": "mrs", "behavior": "domain", "url": "https://gh-proxy.com/https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ai-!cn.mrs", "path": "./ruleset/category-ai-!cn.mrs", "interval": 86400},
    "openai": {"type": "http", "format": "mrs", "behavior": "domain", "url": "https://gh-proxy.com/https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/openai.mrs", "path": "./ruleset/openai.mrs", "interval": 86400},
}


def b64_decode(s: str) -> str:
    s = s.strip()
    s += '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s.encode()).decode(errors='ignore')


def parse_vmess(line: str, idx: int):
    raw = line[len('vmess://') :]
    data = json.loads(b64_decode(raw))
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
        out['ws-opts'] = {'path': q.get('path', ['/'])[0], 'headers': {'Host': q.get('host', [''])[0] or q.get('sni', [''])[0]}}
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
        method, password = b64_decode(u.username).split(':', 1)
    return {'name': name, 'type': 'ss', 'server': u.hostname, 'port': int(u.port or 443), 'cipher': method or 'aes-128-gcm', 'password': password or str(uuid.uuid4()), 'udp': True}


def clean_proxy(p: dict):
    return {k: v for k, v in p.items() if v is not None}


def parse_urls(lines):
    proxies = []
    invalid = []
    for i, raw in enumerate(lines, 1):
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        try:
            p = None
            if line.startswith('vmess://'):
                p = parse_vmess(line, i)
            elif line.startswith('vless://'):
                p = parse_vless(line, i)
            elif line.startswith('trojan://'):
                p = parse_trojan(line, i)
            elif line.startswith('ss://'):
                p = parse_ss(line, i)
            else:
                invalid.append({'line': i, 'reason': 'unsupported schema', 'raw': line[:120]})
                continue

            p = clean_proxy(p)
            if not p.get('server') or not p.get('port'):
                invalid.append({'line': i, 'reason': 'missing server/port', 'raw': line[:120]})
                continue
            proxies.append(p)
        except Exception as e:
            invalid.append({'line': i, 'reason': str(e), 'raw': line[:120]})
    return proxies, invalid


def maybe_decode_subscription(text: str) -> list[str]:
    raw = text.strip()
    if not raw:
        return []
    if '://' in raw and '\n' in raw:
        return [x.strip() for x in raw.splitlines() if x.strip()]
    try:
        decoded = b64_decode(raw)
        if '://' in decoded:
            return [x.strip() for x in decoded.splitlines() if x.strip()]
    except Exception:
        pass
    return [raw]


def fetch_subscription_lines(sub_url: str) -> list[str]:
    req = Request(sub_url, headers={'User-Agent': f'smartclash-gen/{VERSION}'})
    with urlopen(req, timeout=20) as resp:
        body = resp.read().decode('utf-8', errors='ignore')
    return maybe_decode_subscription(body)


def parse_rules(lines):
    out = []
    errors = []
    for i, raw in enumerate(lines, 1):
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        parts = [x.strip() for x in line.split(',')]
        if len(parts) == 1 and parts[0] != 'MATCH':
            errors.append({'line': i, 'reason': 'single token must be MATCH', 'raw': line})
            continue
        if len(parts) == 1:
            out.append({'type': 'MATCH', 'payload': '', 'group': 'Smart-AUTO'})
        elif len(parts) == 2:
            out.append({'type': parts[0], 'payload': parts[1], 'group': 'Smart-AUTO'})
        else:
            out.append({'type': parts[0], 'payload': parts[1], 'group': parts[2] or 'Smart-AUTO', 'extra': parts[3:]})
    return out, errors


def to_rule_line(rule: dict) -> str:
    if rule['type'] == 'MATCH':
        return 'MATCH,Smart-AUTO'
    base = [rule['type'], rule['payload'], rule['group']]
    base.extend(rule.get('extra', []))
    return ','.join(base)


def build_config(proxies, rules, port):
    names = [p['name'] for p in proxies]
    return {
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
        'dns': {'enable': True, 'enhanced-mode': 'redir-host'},
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
        'rules': [to_rule_line(r) for r in rules]
        + [
            'RULE-SET,BanAD,DIRECT',
            'RULE-SET,LocalAreaNetwork,DIRECT',
            'RULE-SET,Telegram,Smart-AUTO',
            'RULE-SET,Netflix,Smart-AUTO',
            'RULE-SET,openai,Smart-AUTO',
            'RULE-SET,category-ai-!cn,Smart-AUTO',
            'MATCH,Smart-AUTO',
        ],
    }


def validate_output_yaml(yml_text: str):
    errs = []
    try:
        obj = yaml.safe_load(yml_text)
    except Exception as e:
        return [f'yaml parse failed: {e}']

    if not isinstance(obj, dict):
        return ['yaml root is not dict']

    if not obj.get('proxies'):
        errs.append('proxies is empty')

    groups = obj.get('proxy-groups') or []
    if not groups:
        errs.append('proxy-groups is empty')
    else:
        for g in groups:
            if g.get('type') == 'smart' and not g.get('proxies'):
                errs.append(f"smart group {g.get('name')} has empty proxies")
    return errs


def write_report(path: Path, report: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')


def deploy_yaml(generated_yaml: Path, deploy_path: Path, backup_dir: Path):
    backup_dir.mkdir(parents=True, exist_ok=True)
    if deploy_path.exists():
        ts = datetime.now().strftime('%Y%m%d-%H%M%S')
        backup_file = backup_dir / f"{deploy_path.name}.{ts}.bak"
        shutil.copy2(deploy_path, backup_file)
    deploy_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(generated_yaml, deploy_path)


def main():
    ap = argparse.ArgumentParser(description=f'smartclash-gen v{VERSION}')
    ap.add_argument('--urls', help='urls.txt path (one url per line)')
    ap.add_argument('--sub-url', action='append', default=[], help='subscription url, can repeat')
    ap.add_argument('--sub-file', help='file contains subscription urls, one per line')
    ap.add_argument('--rules', help='rules/rul path')
    ap.add_argument('--port', type=int, default=7892, help='mixed-port')
    ap.add_argument('--output', default='openclash.yaml', help='output yaml file')
    ap.add_argument('--report', default='report.json', help='validation report output')
    ap.add_argument('--deploy', help='deploy generated yaml to target path, e.g. /etc/openclash/config/custom.yaml')
    ap.add_argument('--backup-dir', default='./backups', help='backup directory when --deploy is used')
    args = ap.parse_args()

    warnings = []
    report = {'version': VERSION, 'warnings': warnings, 'invalid_urls': [], 'invalid_rules': [], 'stats': {}}

    url_lines = []
    if args.urls and Path(args.urls).exists():
        url_lines.extend(Path(args.urls).read_text(encoding='utf-8', errors='ignore').splitlines())

    sub_urls = list(args.sub_url or [])
    if args.sub_file and Path(args.sub_file).exists():
        sub_urls.extend([x.strip() for x in Path(args.sub_file).read_text(encoding='utf-8', errors='ignore').splitlines() if x.strip()])

    for su in sub_urls:
        try:
            fetched = fetch_subscription_lines(su)
            if not fetched:
                warnings.append(f'subscription empty: {su}')
            url_lines.extend(fetched)
        except Exception as e:
            warnings.append(f'failed sub-url: {su} -> {e}')

    dedup = []
    seen = set()
    dup_count = 0
    for line in url_lines:
        t = line.strip()
        if not t:
            continue
        if t in seen:
            dup_count += 1
            continue
        seen.add(t)
        dedup.append(t)

    if dup_count:
        warnings.append(f'deduplicated {dup_count} duplicated url lines')

    proxies, invalid_urls = parse_urls(dedup)
    report['invalid_urls'] = invalid_urls

    if not proxies:
        report['error'] = 'No valid urls parsed (check --urls / --sub-url / --sub-file).'
        write_report(Path(args.report), report)
        print(report['error'])
        sys.exit(EXIT_FAIL)

    rules = []
    if args.rules and Path(args.rules).exists():
        lines = Path(args.rules).read_text(encoding='utf-8', errors='ignore').splitlines()
        rules, invalid_rules = parse_rules(lines)
        report['invalid_rules'] = invalid_rules

    cfg = build_config(proxies, rules, args.port)
    out = Path(args.output)
    yml = yaml.safe_dump(cfg, sort_keys=False, allow_unicode=True)

    yml_errs = validate_output_yaml(yml)
    report['yaml_validation_errors'] = yml_errs
    report['stats'] = {
        'input_url_lines': len(url_lines),
        'dedup_url_lines': len(dedup),
        'parsed_proxies': len(proxies),
        'parsed_rules': len(rules),
    }

    out.write_text(yml, encoding='utf-8')
    out.with_suffix('.md').write_text(f"# smartclash-gen v{VERSION}\n\n```yaml\n{yml}\n```\n", encoding='utf-8')

    if args.deploy:
        try:
            deploy_yaml(out, Path(args.deploy), Path(args.backup_dir))
            report['deploy'] = {'enabled': True, 'target': args.deploy, 'backup_dir': args.backup_dir, 'ok': True}
            print(f'Deployed to: {args.deploy}')
        except Exception as e:
            report['deploy'] = {'enabled': True, 'target': args.deploy, 'backup_dir': args.backup_dir, 'ok': False, 'error': str(e)}
            warnings.append(f'deploy failed: {e}')
    else:
        report['deploy'] = {'enabled': False}

    write_report(Path(args.report), report)

    print(f'Generated {out} and {out.with_suffix(".md")}')
    print(f'Report: {args.report}')

    has_warn = bool(warnings or invalid_urls or report['invalid_rules'] or yml_errs)
    if has_warn:
        print('Completed with warnings. See report for details.')
        sys.exit(EXIT_WARN)

    sys.exit(EXIT_OK)


if __name__ == '__main__':
    main()
