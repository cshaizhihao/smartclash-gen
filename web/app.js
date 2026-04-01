const STORAGE_KEY = 'smartclash-web-v075';
const AUTH_KEY = 'smartclash-web-auth';
const AUTH_SESSION_KEY = 'smartclash-web-auth-session';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return makeId();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_RULE_PROVIDERS = {
  BanAD: { type: 'http', behavior: 'classical', format: 'text', path: './providers/BanAD.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/BanAD.list', interval: 86400 },
  BanProgramAD: { type: 'http', behavior: 'classical', format: 'text', path: './providers/BanProgramAD.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/BanProgramAD.list', interval: 86400 },
  ChinaCompanyIp: { type: 'http', behavior: 'classical', format: 'text', path: './providers/ChinaCompanyIp.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ChinaCompanyIp.list', interval: 86400 },
  ChinaDomain: { type: 'http', behavior: 'classical', format: 'text', path: './providers/ChinaDomain.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ChinaDomain.list', interval: 86400 },
  Gemini: { type: 'http', behavior: 'classical', path: './ruleset/Gemini.yaml', url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Gemini/Gemini.yaml', interval: 86400 },
  GoogleCN: { type: 'http', behavior: 'classical', format: 'text', path: './providers/GoogleCN.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/GoogleCN.list', interval: 86400 },
  LocalAreaNetwork: { type: 'http', behavior: 'classical', format: 'text', path: './providers/LocalAreaNetwork.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/LocalAreaNetwork.list', interval: 86400 },
  Netflix: { type: 'http', behavior: 'classical', path: './ruleset/Netflix.yaml', url: 'https://cdn.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix.yaml', interval: 86400 },
  ProxyLite: { type: 'http', behavior: 'classical', format: 'text', path: './providers/ProxyLite.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ProxyLite.list', interval: 86400 },
  ProxyMedia: { type: 'http', behavior: 'classical', format: 'text', path: './providers/ProxyMedia.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/ProxyMedia.list', interval: 86400 },
  SteamCN: { type: 'http', behavior: 'classical', format: 'text', path: './providers/SteamCN.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Ruleset/SteamCN.list', interval: 86400 },
  Telegram: { type: 'http', behavior: 'classical', format: 'text', path: './providers/Telegram.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/Telegram.list', interval: 86400 },
  UnBan: { type: 'http', behavior: 'classical', format: 'text', path: './providers/UnBan.txt', url: 'https://cdn.jsdelivr.net/gh/ACL4SSR/ACL4SSR@master/Clash/UnBan.list', interval: 86400 },
  'category-ai-!cn': { type: 'http', format: 'mrs', behavior: 'domain', url: 'https://gh-proxy.com/https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ai-!cn.mrs', path: './ruleset/category-ai-!cn.mrs', interval: 86400 },
  openai: { type: 'http', format: 'mrs', behavior: 'domain', url: 'https://gh-proxy.com/https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/openai.mrs', path: './ruleset/openai.mrs', interval: 86400 },
};

function createDefaultState() {
  return {
    nodes: [
      { id: makeId(), name: 'HK-01', url: '', region: 'HK' },
      { id: makeId(), name: 'SG-01', url: '', region: 'SG' },
      { id: makeId(), name: 'JP-01', url: '', region: 'JP' },
    ],
    groups: [
      { id: makeId(), name: 'Smart-AUTO', type: 'smart', members: [] },
      { id: makeId(), name: 'Smart-HK', type: 'select', members: [] },
    ],
    rules: ['DOMAIN-SUFFIX,google.com,Smart-AUTO', 'MATCH,Smart-AUTO'],
    mixedPort: 7892,
  };
}

const state = createDefaultState();

const NAV_SCHEMA = {
  nodes: {
    label: '节点模块',
    subs: {
      import: { label: '导入', thirds: { quick: '快速导入' } },
      editor: { label: '编辑', thirds: { meta: '元信息' } },
      generator: { label: '生成', thirds: { region: '按分区' } },
    },
  },
  groups: { label: '策略组模块', subs: { canvas: { label: '编排', thirds: { drag: '拖拽画布' } } } },
  rules: { label: '规则模块', subs: { editor: { label: '编辑器', thirds: { line: '行编辑' } } } },
  publish: { label: '发布模块', subs: { actions: { label: '发布', thirds: { output: '导出与发布' } } } },
};

const viewState = { main: 'nodes', sub: 'import', third: 'quick' };

const el = {
  authGate: document.getElementById('authGate'),
  authUser: document.getElementById('authUser'),
  authPass: document.getElementById('authPass'),
  authRemember: document.getElementById('authRemember'),
  authBtn: document.getElementById('authBtn'),
  authTips: document.getElementById('authTips'),
  appShell: document.getElementById('appShell'),
  logoutBtn: document.getElementById('logoutBtn'),
  mainTabs: document.getElementById('mainTabs'),
  subTabs: document.getElementById('subTabs'),
  thirdTabs: document.getElementById('thirdTabs'),

  nodeName: document.getElementById('nodeName'),
  addNode: document.getElementById('addNode'),
  nodeUrls: document.getElementById('nodeUrls'),
  importUrlsBtn: document.getElementById('importUrlsBtn'),
  clearUrlsBtn: document.getElementById('clearUrlsBtn'),
  importStatus: document.getElementById('importStatus'),

  groupName: document.getElementById('groupName'),
  groupType: document.getElementById('groupType'),
  addGroup: document.getElementById('addGroup'),
  nodePool: document.getElementById('nodePool'),
  nodeEditorSelect: document.getElementById('nodeEditorSelect'),
  nodeEditorName: document.getElementById('nodeEditorName'),
  nodeEditorRegion: document.getElementById('nodeEditorRegion'),
  nodeEditorUrl: document.getElementById('nodeEditorUrl'),
  saveNodeMeta: document.getElementById('saveNodeMeta'),
  applyRegionModules: document.getElementById('applyRegionModules'),
  groups: document.getElementById('groups'),

  rules: document.getElementById('rules'),
  mixedPort: document.getElementById('mixedPort'),
  saveBtn: document.getElementById('saveBtn'),
  copyBtn: document.getElementById('copyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  downloadYamlBtn: document.getElementById('downloadYamlBtn'),
  publishBtn: document.getElementById('publishBtn'),
  autoFixBtn: document.getElementById('autoFixBtn'),
  resetBtn: document.getElementById('resetBtn'),
  publishStatus: document.getElementById('publishStatus'),
  markdown: document.getElementById('markdown'),
  warnings: document.getElementById('warnings'),
};

function simpleHash(input) {
  return btoa(unescape(encodeURIComponent(input)));
}

function getAuthConfig() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
  } catch {
    return null;
  }
}

function setAuthConfig(username, password) {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ username, passHash: simpleHash(password) })
  );
}

function setAuthed(remember) {
  if (remember) localStorage.setItem(AUTH_SESSION_KEY, '1');
  else sessionStorage.setItem(AUTH_SESSION_KEY, '1');
}

function clearSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

function isAuthed() {
  return localStorage.getItem(AUTH_SESSION_KEY) === '1' || sessionStorage.getItem(AUTH_SESSION_KEY) === '1';
}

function showApp() {
  el.authGate.classList.add('hidden');
  el.appShell.classList.remove('blurred');
}

function showAuth(message) {
  el.authTips.textContent = message || '请登录后使用';
  el.authGate.classList.remove('hidden');
  el.appShell.classList.add('blurred');
}

el.authBtn.addEventListener('click', () => {
  const username = el.authUser.value.trim();
  const password = el.authPass.value.trim();
  if (!username || !password) {
    showAuth('用户名和密码不能为空');
    return;
  }

  const auth = getAuthConfig();
  if (!auth) {
    setAuthConfig(username, password);
    setAuthed(el.authRemember.checked);
    showApp();
    return;
  }

  if (auth.username === username && auth.passHash === simpleHash(password)) {
    setAuthed(el.authRemember.checked);
    showApp();
  } else {
    showAuth('登录失败：用户名或密码错误');
  }
});

el.logoutBtn.addEventListener('click', () => {
  clearSession();
  showAuth('已退出登录');
});

function renderTabs(container, items, key, active, onClick) {
  if (!container) return;
  container.innerHTML = Object.entries(items)
    .map(([id, label]) => `<button class="tab ${id === active ? 'active' : ''}" data-${key}="${id}">${label}</button>`)
    .join('');
  container.querySelectorAll(`button[data-${key}]`).forEach((btn) => {
    btn.addEventListener('click', () => onClick(btn.dataset[key]));
  });
}

function ensureViewState() {
  const mainCfg = NAV_SCHEMA[viewState.main] || NAV_SCHEMA.nodes;
  const subKeys = Object.keys(mainCfg.subs);
  if (!mainCfg.subs[viewState.sub]) viewState.sub = subKeys[0];
  const thirdCfg = mainCfg.subs[viewState.sub].thirds;
  const thirdKeys = Object.keys(thirdCfg);
  if (!thirdCfg[viewState.third]) viewState.third = thirdKeys[0];
}

function renderNavigation() {
  ensureViewState();

  renderTabs(
    el.mainTabs,
    Object.fromEntries(Object.entries(NAV_SCHEMA).map(([k, v]) => [k, v.label])),
    'main',
    viewState.main,
    (next) => {
      viewState.main = next;
      const firstSub = Object.keys(NAV_SCHEMA[next].subs)[0];
      viewState.sub = firstSub;
      viewState.third = Object.keys(NAV_SCHEMA[next].subs[firstSub].thirds)[0];
      renderNavigation();
      renderPanes();
    }
  );

  const subCfg = NAV_SCHEMA[viewState.main].subs;
  renderTabs(
    el.subTabs,
    Object.fromEntries(Object.entries(subCfg).map(([k, v]) => [k, v.label])),
    'sub',
    viewState.sub,
    (next) => {
      viewState.sub = next;
      viewState.third = Object.keys(subCfg[next].thirds)[0];
      renderNavigation();
      renderPanes();
    }
  );

  const thirdCfg = subCfg[viewState.sub].thirds;
  renderTabs(el.thirdTabs, thirdCfg, 'third', viewState.third, (next) => {
    viewState.third = next;
    renderNavigation();
    renderPanes();
  });
}

function renderPanes() {
  document.querySelectorAll('.pane').forEach((pane) => {
    const ok =
      pane.dataset.main === viewState.main &&
      pane.dataset.sub === viewState.sub &&
      pane.dataset.third === viewState.third;
    pane.classList.toggle('active', ok);
  });
}

function mkNodeLi(node) {
  const li = document.createElement('li');
  li.className = 'item';
  li.dataset.id = node.id;
  li.textContent = `[${node.region || 'AUTO'}] ${node.name}`;
  return li;
}

function inferRegion(name = '') {
  if (/HK|Hong\s?Kong|香港/i.test(name)) return 'HK';
  if (/SG|Singapore|新加坡/i.test(name)) return 'SG';
  if (/JP|Japan|日本/i.test(name)) return 'JP';
  if (/US|America|美国/i.test(name)) return 'US';
  return 'AUTO';
}

function setImportStatus(text, type = 'idle') {
  el.importStatus.textContent = text;
  el.importStatus.dataset.type = type;
}

function safeDecodeBase64(input) {
  const normalized = input.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}

function parseNodeUrl(line, index) {
  const raw = line.trim();
  if (!raw) return null;
  const m = raw.match(/^(vless|vmess|trojan|ss):\/\//i);
  if (!m) return { ok: false, error: `第 ${index + 1} 行协议不支持` };
  const nameMatch = raw.match(/#(.+)$/);
  const name = nameMatch ? decodeURIComponent(nameMatch[1]).trim() : `${m[1].toUpperCase()}-${index + 1}`;
  if (!name) return { ok: false, error: `第 ${index + 1} 行节点名为空` };
  return { ok: true, name, url: raw };
}

function parseVmessUrl(url) {
  const payload = JSON.parse(safeDecodeBase64(url.slice('vmess://'.length)));
  const network = payload.net || 'tcp';
  const proxy = {
    name: payload.ps || 'vmess-node',
    type: 'vmess',
    server: payload.add,
    port: Number(payload.port || 443),
    uuid: payload.id,
    alterId: Number(payload.aid || 0),
    cipher: payload.scy || 'auto',
    tls: payload.tls === 'tls',
    network,
    'skip-cert-verify': true,
  };
  if (network === 'ws') {
    proxy['ws-opts'] = {
      path: payload.path || '/',
      headers: { Host: payload.host || '' },
    };
  }
  if (payload.sni) proxy.servername = payload.sni;
  return proxy;
}

function parseVlessUrl(url) {
  const parsed = new URL(url);
  const security = parsed.searchParams.get('security') || '';
  const network = parsed.searchParams.get('type') || 'tcp';
  const proxy = {
    name: decodeURIComponent(parsed.hash.slice(1) || 'vless-node'),
    type: 'vless',
    server: parsed.hostname,
    port: Number(parsed.port || 443),
    uuid: parsed.username,
    udp: true,
    tls: security === 'tls' || security === 'reality',
    network,
    servername: parsed.searchParams.get('sni') || undefined,
    'skip-cert-verify': true,
  };
  if (network === 'ws') {
    proxy['ws-opts'] = {
      path: parsed.searchParams.get('path') || '/',
      headers: {
        Host: parsed.searchParams.get('host') || parsed.searchParams.get('sni') || '',
      },
    };
  }
  if (security === 'reality') {
    proxy['reality-opts'] = {
      'public-key': parsed.searchParams.get('pbk') || '',
      'short-id': parsed.searchParams.get('sid') || '',
    };
    proxy['client-fingerprint'] = parsed.searchParams.get('fp') || 'chrome';
  }
  return proxy;
}

function parseTrojanUrl(url) {
  const parsed = new URL(url);
  const proxy = {
    name: decodeURIComponent(parsed.hash.slice(1) || 'trojan-node'),
    type: 'trojan',
    server: parsed.hostname,
    port: Number(parsed.port || 443),
    password: parsed.username,
    sni: parsed.searchParams.get('sni') || parsed.hostname,
    'skip-cert-verify': true,
    udp: true,
  };
  if ((parsed.searchParams.get('type') || 'tcp') === 'ws') {
    proxy.network = 'ws';
    proxy['ws-opts'] = {
      path: parsed.searchParams.get('path') || '/',
      headers: {
        Host: parsed.searchParams.get('host') || parsed.searchParams.get('sni') || '',
      },
    };
  }
  return proxy;
}

function parseSsUrl(url, fallbackName) {
  const parsed = new URL(url);
  let method;
  let password;
  if (parsed.username && parsed.username.includes(':')) {
    [method, password] = parsed.username.split(':', 2);
  } else if (parsed.username) {
    [method, password] = safeDecodeBase64(parsed.username).split(':', 2);
  }
  return {
    name: decodeURIComponent(parsed.hash.slice(1) || fallbackName || 'ss-node'),
    type: 'ss',
    server: parsed.hostname,
    port: Number(parsed.port || 443),
    cipher: method || 'aes-128-gcm',
    password: password || 'change-me',
    udp: true,
  };
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

function buildProxyFromNode(node, index) {
  if (!node.url) {
    return {
      name: node.name,
      type: 'ss',
      server: '127.0.0.1',
      port: 443,
      cipher: 'aes-128-gcm',
      password: 'fill-your-node-url-first',
      udp: true,
    };
  }

  const line = node.url.trim();
  if (line.startsWith('vmess://')) return compactObject(parseVmessUrl(line));
  if (line.startsWith('vless://')) return compactObject(parseVlessUrl(line));
  if (line.startsWith('trojan://')) return compactObject(parseTrojanUrl(line));
  if (line.startsWith('ss://')) return compactObject(parseSsUrl(line, `${node.name || 'ss'}-${index + 1}`));
  throw new Error(`不支持的节点协议：${node.name}`);
}

function syncGroupOrder() {
  const ids = [...el.groups.children].map((x) => x.dataset.id);
  state.groups.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  refreshMarkdownPreview();
  persistState();
}

function syncFromDom() {
  state.groups.forEach((group) => {
    const ul = document.getElementById(`group-${group.id}`);
    if (!ul) return;
    group.members = [...ul.children].map((x) => x.dataset.id);
  });

  const used = new Set(state.groups.flatMap((g) => g.members));
  const poolIds = [...el.nodePool.children].map((x) => x.dataset.id);
  const keepPool = poolIds.filter((id) => !used.has(id));
  const missing = state.nodes
    .filter((n) => !used.has(n.id) && !keepPool.includes(n.id))
    .map((n) => n.id);

  el.nodePool.innerHTML = '';
  [...keepPool, ...missing].forEach((id) => {
    const node = state.nodes.find((n) => n.id === id);
    if (node) el.nodePool.appendChild(mkNodeLi(node));
  });

  refreshMarkdownPreview();
  persistState();
}

function persistState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      nodes: state.nodes,
      groups: state.groups,
      rules: el.rules.value.split('\n'),
      mixedPort: Number(el.mixedPort.value || state.mixedPort || 7892),
      nodeUrls: el.nodeUrls.value || '',
    })
  );
}

function replaceState(nextState) {
  state.nodes.splice(0, state.nodes.length, ...((nextState.nodes || []).map((n) => ({ ...n, region: n.region || inferRegion(n.name) }))));
  state.groups.splice(0, state.groups.length, ...(nextState.groups || []));
  state.rules.splice(0, state.rules.length, ...(nextState.rules || []));
  state.mixedPort = Number(nextState.mixedPort || 7892);
}

function syncNodeEditorOptions() {
  if (!el.nodeEditorSelect) return;
  const current = el.nodeEditorSelect.value;
  el.nodeEditorSelect.innerHTML = state.nodes
    .map((node) => `<option value="${node.id}">[${node.region || 'AUTO'}] ${node.name}</option>`)
    .join('');
  if (!state.nodes.length) {
    el.nodeEditorName.value = '';
    el.nodeEditorUrl.value = '';
    el.nodeEditorRegion.value = 'AUTO';
    return;
  }
  el.nodeEditorSelect.value = state.nodes.some((n) => n.id === current) ? current : state.nodes[0].id;
  const selected = state.nodes.find((n) => n.id === el.nodeEditorSelect.value);
  if (selected) {
    el.nodeEditorName.value = selected.name || '';
    el.nodeEditorUrl.value = selected.url || '';
    el.nodeEditorRegion.value = selected.region || 'AUTO';
  }
}

function applyRegionModulesFromNodes() {
  const keep = [];
  const byName = new Map();
  state.groups.forEach((g) => byName.set(g.name, g));

  const smartAuto = byName.get('Smart-AUTO') || { id: makeId(), name: 'Smart-AUTO', type: 'smart', members: [] };
  smartAuto.type = 'smart';
  smartAuto.members = state.nodes.map((n) => n.id);
  keep.push(smartAuto);

  const regions = ['HK', 'SG', 'JP', 'US', 'OTHER'];
  regions.forEach((region) => {
    const name = `Smart-${region}`;
    const g = byName.get(name) || { id: makeId(), name, type: 'select', members: [] };
    g.type = 'select';
    g.members = state.nodes.filter((n) => (n.region || 'AUTO') === region).map((n) => n.id);
    keep.push(g);
  });

  const direct = byName.get('DIRECT') || { id: makeId(), name: 'DIRECT', type: 'select', members: [] };
  direct.type = 'select';
  keep.push(direct);

  state.groups.splice(0, state.groups.length, ...keep);
}

function hydrateState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    replaceState({
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : createDefaultState().nodes,
      groups: Array.isArray(parsed.groups) ? parsed.groups : createDefaultState().groups,
      rules: Array.isArray(parsed.rules) ? parsed.rules : createDefaultState().rules,
      mixedPort: parsed.mixedPort || 7892,
    });
    if (typeof parsed.nodeUrls === 'string') el.nodeUrls.value = parsed.nodeUrls;
  } catch {
    // ignore
  }
}

function render() {
  el.nodePool.innerHTML = '';
  const used = new Set(state.groups.flatMap((g) => g.members));
  state.nodes
    .filter((n) => !used.has(n.id))
    .forEach((n) => el.nodePool.appendChild(mkNodeLi(n)));

  el.groups.innerHTML = '';
  state.groups.forEach((g) => {
    const box = document.createElement('article');
    box.className = 'group';
    box.dataset.id = g.id;
    box.innerHTML = `<h4>${g.name} <small>(${g.type})</small></h4><ul class="list" id="group-${g.id}"></ul>`;
    const ul = box.querySelector('ul');
    g.members.forEach((id) => {
      const node = state.nodes.find((n) => n.id === id);
      if (node) ul.appendChild(mkNodeLi(node));
    });
    el.groups.appendChild(box);
    new Sortable(ul, { group: 'nodes', animation: 150, onSort: syncFromDom });
  });

  new Sortable(el.nodePool, { group: 'nodes', animation: 150, onSort: syncFromDom });
  new Sortable(el.groups, { animation: 150, handle: 'h4', onSort: syncGroupOrder });

  el.rules.value = state.rules.join('\n');
  el.mixedPort.value = state.mixedPort;
  syncNodeEditorOptions();
  refreshMarkdownPreview();
}

function buildPolicyPriority(names) {
  const has = (pattern) => names.some((name) => pattern.test(name));
  const buckets = [];
  if (has(/HK|Hong\s?Kong|香港/i)) buckets.push('HK|Hong\\s?Kong|香港:1.2');
  if (has(/SG|Singapore|新加坡/i)) buckets.push('SG|Singapore|新加坡:1.2');
  if (has(/JP|Japan|日本/i)) buckets.push('JP|Japan|日本:1.1');
  if (has(/US|America|United\s?States|美国/i)) buckets.push('US|America|United\\s?States|美国:1.0');
  return buckets.join(';') || 'HK|Hong\\s?Kong|香港:1.2;SG|Singapore|新加坡:1.2;JP|Japan|日本:1.1;US|America|United\\s?States|美国:1.0';
}

function buildProxyGroup(group, names) {
  const proxies = group.members.map((id) => state.nodes.find((node) => node.id === id)?.name).filter(Boolean);
  const base = {
    name: group.name,
    type: group.type,
    proxies: proxies.length ? proxies : names,
  };

  if (group.type === 'smart') {
    base['policy-priority'] = buildPolicyPriority(base.proxies);
    base['prefer-asn'] = true;
    base['sample-rate'] = 1;
    base.collectdata = false;
    base.uselightgbm = false;
  }

  return base;
}

function buildYamlObject() {
  const proxies = state.nodes.map((node, index) => buildProxyFromNode(node, index));
  const proxyNames = proxies.map((proxy) => proxy.name);
  const proxyGroups = state.groups.map((group) => buildProxyGroup(group, proxyNames));

  if (!proxyGroups.some((group) => group.name === 'DIRECT')) {
    proxyGroups.push({ name: 'DIRECT', type: 'select', proxies: ['DIRECT'] });
  }

  const userRules = el.rules.value.split('\n').map((x) => x.trim()).filter(Boolean);
  if (!userRules.some((r) => r.startsWith('MATCH,'))) userRules.push('MATCH,Smart-AUTO');

  const builtinRules = [
    'RULE-SET,BanAD,DIRECT',
    'RULE-SET,LocalAreaNetwork,DIRECT',
    'RULE-SET,Telegram,Smart-AUTO',
    'RULE-SET,Netflix,Smart-AUTO',
    'RULE-SET,openai,Smart-AUTO',
    'RULE-SET,category-ai-!cn,Smart-AUTO',
    'MATCH,Smart-AUTO',
  ];

  const mergedRules = [];
  const seen = new Set();
  [...userRules, ...builtinRules].forEach((rule) => {
    if (!seen.has(rule)) {
      seen.add(rule);
      mergedRules.push(rule);
    }
  });

  return {
    'mixed-port': Number(el.mixedPort.value || state.mixedPort || 7892),
    'allow-lan': true,
    mode: 'rule',
    'log-level': 'info',
    'external-controller': ':9090',
    ipv6: false,
    'keep-alive-interval': 15,
    'tcp-concurrent': true,
    'unified-delay': true,
    proxies,
    'rule-providers': DEFAULT_RULE_PROVIDERS,
    dns: { enable: true, 'enhanced-mode': 'redir-host' },
    'proxy-groups': proxyGroups,
    rules: mergedRules,
  };
}

function buildMarkdown() {
  const yaml = jsyaml.dump(buildYamlObject(), { noRefs: true });
  return `# smartclash-gen 可编辑配置\n\n\`\`\`yaml\n${yaml}\`\`\`\n`;
}

function validateState() {
  const warnings = [];
  const blockers = [];
  const suggestions = [];
  const knownNodeIds = new Set(state.nodes.map((n) => n.id));
  const knownGroupNames = new Set(state.groups.map((g) => g.name));

  state.groups.forEach((g) => {
    if (g.type === 'smart' && g.members.length === 0) {
      warnings.push(`Smart 组「${g.name}」当前为空成员`);
      blockers.push(`Smart 组「${g.name}」为空，禁止发布`);
      suggestions.push(`可将至少 1 个节点拖入 Smart 组「${g.name}」`);
    }
    g.members.forEach((id) => {
      if (!knownNodeIds.has(id)) {
        warnings.push(`策略组「${g.name}」存在无效节点引用：${id}`);
        blockers.push(`策略组「${g.name}」含无效节点引用，禁止发布`);
      }
    });
  });

  const lines = el.rules.value.split('\n').map((x) => x.trim()).filter(Boolean);
  lines.forEach((line, i) => {
    const segs = line.split(',').map((s) => s.trim()).filter(Boolean);
    if (segs.length < 2) {
      blockers.push(`规则第 ${i + 1} 行格式错误，禁止发布`);
      suggestions.push(`规则第 ${i + 1} 行至少需要“类型,值[,策略组]”`);
      return;
    }
    if (segs.length >= 3) {
      const target = segs[2];
      if (target !== 'DIRECT' && !knownGroupNames.has(target)) {
        blockers.push(`规则第 ${i + 1} 行引用不存在策略组，禁止发布`);
        suggestions.push(`将规则第 ${i + 1} 行目标策略组改为已存在组，或改为 Smart-AUTO`);
      }
    }
  });

  state.nodes.forEach((node, index) => {
    if (!node.url) {
      warnings.push(`节点「${node.name}」未填写真实 URL，将以占位配置导出`);
      return;
    }
    try {
      buildProxyFromNode(node, index);
    } catch (error) {
      blockers.push(`节点「${node.name}」解析失败：${error.message}`);
      suggestions.push(`修正节点「${node.name}」URL 协议/参数后再发布`);
    }
  });

  const p = Number(el.mixedPort.value || 0);
  if (!Number.isInteger(p) || p < 1 || p > 65535) {
    blockers.push('mixed-port 必须是 1-65535 之间的整数，禁止发布');
    suggestions.push('将 mixed-port 设置为 1-65535 的整数（建议 7892）');
  }

  return { warnings, blockers, suggestions };
}

function renderWarnings(result) {
  const items = [];
  result.blockers.forEach((x) => items.push(`<li>⛔ ${x}</li>`));
  result.warnings.forEach((x) => items.push(`<li>⚠️ ${x}</li>`));
  result.suggestions.forEach((x) => items.push(`<li>💡 ${x}</li>`));
  el.warnings.innerHTML = items.length ? items.join('') : '<li class="ok">✅ 状态校验通过，可保存可发布</li>';
}

function refreshMarkdownPreview() {
  if (!el.markdown.dataset.manualEdit) el.markdown.value = buildMarkdown();
  renderWarnings(validateState());
}

function setPublishStatus(text, type = 'idle') {
  el.publishStatus.textContent = text;
  el.publishStatus.dataset.type = type;
}

el.addNode.addEventListener('click', () => {
  const name = el.nodeName.value.trim();
  if (!name) return;
  state.nodes.push({ id: makeId(), name, url: '', region: inferRegion(name) });
  el.nodeName.value = '';
  render();
  persistState();
});

el.importUrlsBtn.addEventListener('click', () => {
  const lines = el.nodeUrls.value.split('\n').map((x) => x.trim()).filter(Boolean);
  if (!lines.length) return setImportStatus('请先粘贴节点 URL', 'error');

  const exists = new Set(state.nodes.map((n) => n.name));
  let okCount = 0;
  let dupCount = 0;
  const errors = [];

  lines.forEach((line, i) => {
    const parsed = parseNodeUrl(line, i);
    if (!parsed) return;
    if (!parsed.ok) return errors.push(parsed.error);
    if (exists.has(parsed.name)) return dupCount++;
    exists.add(parsed.name);
    state.nodes.push({ id: makeId(), name: parsed.name, url: parsed.url, region: inferRegion(parsed.name) });
    okCount++;
  });

  render();
  persistState();
  if (errors.length) setImportStatus(`导入 ${okCount}，重复 ${dupCount}，失败 ${errors.length}`, 'error');
  else setImportStatus(`导入成功 ${okCount}，重复跳过 ${dupCount}`, 'success');
});

el.addGroup.addEventListener('click', () => {
  const name = el.groupName.value.trim();
  if (!name) return;
  state.groups.push({ id: makeId(), name, type: el.groupType.value, members: [] });
  el.groupName.value = '';
  render();
  persistState();
});

el.nodeEditorSelect?.addEventListener('change', () => {
  const selected = state.nodes.find((n) => n.id === el.nodeEditorSelect.value);
  if (!selected) return;
  el.nodeEditorName.value = selected.name || '';
  el.nodeEditorUrl.value = selected.url || '';
  el.nodeEditorRegion.value = selected.region || 'AUTO';
});

el.saveNodeMeta?.addEventListener('click', () => {
  const selected = state.nodes.find((n) => n.id === el.nodeEditorSelect.value);
  if (!selected) return;
  selected.name = el.nodeEditorName.value.trim() || selected.name;
  selected.url = el.nodeEditorUrl.value.trim();
  selected.region = el.nodeEditorRegion.value || inferRegion(selected.name);
  render();
  persistState();
  setImportStatus(`已更新节点：${selected.name}`, 'success');
});

el.applyRegionModules?.addEventListener('click', () => {
  applyRegionModulesFromNodes();
  render();
  persistState();
  setPublishStatus('已按节点分区重建策略组模块（Smart-HK/SG/JP/US/OTHER）', 'success');
});

el.clearUrlsBtn.addEventListener('click', () => {
  state.nodes.forEach((node) => {
    node.url = '';
  });
  el.nodeUrls.value = '';
  render();
  persistState();
  setImportStatus('已清空已导入 URL', 'idle');
  setPublishStatus('已清空节点 URL，请重新导入后再发布', 'idle');
});

el.saveBtn.addEventListener('click', () => {
  const result = validateState();
  renderWarnings(result);
  el.markdown.dataset.manualEdit = '';
  el.markdown.value = buildMarkdown();
  state.mixedPort = Number(el.mixedPort.value || 7892);
  persistState();
  setPublishStatus('已保存最新 Markdown，等待发布', 'idle');
});

el.publishBtn.addEventListener('click', () => {
  const result = validateState();
  renderWarnings(result);
  if (result.blockers.length) {
    const summary = result.blockers.slice(0, 2).join('；');
    return setPublishStatus(`发布失败（阻塞 ${result.blockers.length} / 警告 ${result.warnings.length}）：${summary}${result.blockers.length > 2 ? '…' : ''}`, 'error');
  }
  persistState();
  setPublishStatus(`发布成功：无阻塞项（警告 ${result.warnings.length}）`, 'success');
});

el.copyBtn.addEventListener('click', async () => {
  await navigator.clipboard.writeText(el.markdown.value);
  el.copyBtn.textContent = '已复制 ✅';
  setTimeout(() => (el.copyBtn.textContent = '复制 Markdown'), 1200);
});

el.downloadBtn.addEventListener('click', () => {
  const blob = new Blob([el.markdown.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smartclash-config.md';
  a.click();
  URL.revokeObjectURL(url);
});

el.downloadYamlBtn.addEventListener('click', () => {
  const yaml = jsyaml.dump(buildYamlObject(), { noRefs: true });
  const blob = new Blob([yaml], { type: 'application/x-yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smartclash-config.yaml';
  a.click();
  URL.revokeObjectURL(url);
});

el.rules.addEventListener('input', () => {
  state.rules = el.rules.value.split('\n');
  refreshMarkdownPreview();
  persistState();
});

el.mixedPort.addEventListener('input', () => {
  state.mixedPort = Number(el.mixedPort.value || 7892);
  refreshMarkdownPreview();
  persistState();
});

el.autoFixBtn?.addEventListener('click', () => {
  let fixed = 0;
  const validIds = new Set(state.nodes.map((n) => n.id));

  state.groups.forEach((g) => {
    const before = g.members.length;
    g.members = g.members.filter((id) => validIds.has(id));
    fixed += before - g.members.length;
  });

  const groupNames = new Set(state.groups.map((g) => g.name));
  const lines = el.rules.value.split('\n').map((x) => x.trim()).filter(Boolean);
  const fixedRules = lines.map((line) => {
    const segs = line.split(',').map((s) => s.trim());
    if (segs.length >= 3) {
      const target = segs[2];
      if (target !== 'DIRECT' && !groupNames.has(target)) {
        segs[2] = 'Smart-AUTO';
        fixed += 1;
      }
      return segs.join(',');
    }
    return line;
  });

  el.rules.value = fixedRules.join('\n');
  state.rules = fixedRules;
  render();
  persistState();
  setPublishStatus(fixed ? `自动修复完成：共修复 ${fixed} 处引用` : '自动修复完成：未发现可修复问题', fixed ? 'success' : 'idle');
});

el.resetBtn.addEventListener('click', () => {
  replaceState(createDefaultState());
  el.nodeName.value = '';
  el.groupName.value = '';
  el.nodeUrls.value = '';
  el.markdown.dataset.manualEdit = '';
  render();
  persistState();
  setImportStatus('已重置为示例数据', 'idle');
  setPublishStatus('已重置，等待重新导入或编辑', 'idle');
});

el.nodeUrls.addEventListener('input', persistState);
el.markdown.addEventListener('input', () => (el.markdown.dataset.manualEdit = '1'));

hydrateState();
render();
renderNavigation();
renderPanes();
setPublishStatus('尚未发布', 'idle');
setImportStatus('未导入', 'idle');

if (isAuthed()) showApp();
else showAuth('请先登录，首次使用会自动初始化账户');