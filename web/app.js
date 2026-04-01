const STORAGE_KEY = 'smartclash-web-v1318';
const APP_VERSION = '0.13.18';
const UPDATE_CMD = 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main/install.sh)" -- --update -d ~/.smartclash-gen';
const AUTH_DISABLED = true;
const AUTH_KEY = 'smartclash-web-auth';
const AUTH_SESSION_KEY = 'smartclash-web-auth-session';
const DEFAULT_RULE_LINES = ['DOMAIN-SUFFIX,google.com,Smart-AUTO', 'MATCH,Smart-AUTO'];
const RULE_PRESETS = {
  ai: [
    'RULE-SET,openai,Smart-AUTO',
    'RULE-SET,category-ai-!cn,Smart-AUTO',
    'DOMAIN-SUFFIX,anthropic.com,Smart-AUTO',
    'DOMAIN-SUFFIX,claude.ai,Smart-AUTO',
    'MATCH,Smart-AUTO',
  ],
  media: [
    'RULE-SET,Netflix,Smart-AUTO',
    'RULE-SET,Telegram,Smart-AUTO',
    'DOMAIN-SUFFIX,youtube.com,Smart-AUTO',
    'DOMAIN-SUFFIX,spotify.com,Smart-AUTO',
    'MATCH,Smart-AUTO',
  ],
  domestic: [
    'RULE-SET,LocalAreaNetwork,DIRECT',
    'RULE-SET,ChinaDomain,DIRECT',
    'RULE-SET,ChinaCompanyIp,DIRECT',
    'MATCH,Smart-AUTO',
  ],
};

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
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
    nodes: [],
    groups: [
      { id: makeId(), name: 'Smart-AUTO', type: 'smart', members: [] },
    ],
    rules: [...DEFAULT_RULE_LINES],
    mixedPort: 7892,
    transitGroupName: 'Smart-Transit',
    egressGroupName: 'Smart-Egress',
    chainGroupName: 'Smart-Chain',
  };
}

const state = createDefaultState();

const NAV_SCHEMA = {
  nodes: {
    label: '节点模块',
    subs: {
      import: { label: '导入节点', thirds: { quick: '批量导入' } },
      editor: { label: '整理节点', thirds: { meta: '节点信息' } },
      generator: { label: '生成模块', thirds: { region: '按地区生成' } },
    },
  },
  groups: { label: '策略组模块', subs: { canvas: { label: '编排策略', thirds: { drag: '拖拽画布' } } } },
  rules: { label: '规则模块', subs: { editor: { label: '规则检查', thirds: { line: '规则列表' } } } },
  publish: { label: '发布模块', subs: { actions: { label: '规则校验 / 导出发布', thirds: { output: '导出与发布' } } } },
};

const viewState = { main: 'nodes', sub: 'import', third: 'quick' };
const importConflictState = { dupEntries: [], errors: [] };
const historyState = { undo: [], redo: [], undoAction: [], redoAction: [] };
let savedBaseline = null;

const el = {
  authGate: document.getElementById('authGate'),
  authUser: document.getElementById('authUser'),
  authPass: document.getElementById('authPass'),
  toggleAuthPass: document.getElementById('toggleAuthPass'),
  authRemember: document.getElementById('authRemember'),
  authBtn: document.getElementById('authBtn'),
  authTips: document.getElementById('authTips'),
  appShell: document.getElementById('appShell'),
  logoutBtn: document.getElementById('logoutBtn'),
  mainTabs: document.getElementById('mainTabs'),
  subTabs: document.getElementById('subTabs'),
  thirdTabs: document.getElementById('thirdTabs'),
  breadcrumbText: document.getElementById('breadcrumbText'),
  stepProgressText: document.getElementById('stepProgressText'),
  stepProgressFill: document.getElementById('stepProgressFill'),
  flowStage: document.getElementById('flowStage'),
  stepPrev: document.getElementById('stepPrev'),
  stepNext: document.getElementById('stepNext'),
  stepNextCompose: document.getElementById('stepNextCompose'),
  stepPrevPublish: document.getElementById('stepPrevPublish'),
  quickFlowBtn: document.getElementById('quickFlowBtn'),
  wizStep1: document.getElementById('wizStep1'),
  wizStep2: document.getElementById('wizStep2'),
  wizStep3: document.getElementById('wizStep3'),
  goStep2: document.getElementById('goStep2'),
  jumpToGroupStep: document.getElementById('jumpToGroupStep'),
  goStep3: document.getElementById('goStep3'),
  toggleAdvanced: document.getElementById('toggleAdvanced'),
  smartActionBtn: document.getElementById('smartActionBtn'),
  advancedOps: document.getElementById('advancedOps'),
  undoBtn: document.getElementById('undoBtn'),
  redoBtn: document.getElementById('redoBtn'),

  nodeName: document.getElementById('nodeName'),
  addNode: document.getElementById('addNode'),
  nodeUrls: document.getElementById('nodeUrls'),
  subUrls: document.getElementById('subUrls'),
  fetchSubsBtn: document.getElementById('fetchSubsBtn'),
  subFetchStatus: document.getElementById('subFetchStatus'),
  importUrlsBtn: document.getElementById('importUrlsBtn'),
  clearUrlsBtn: document.getElementById('clearUrlsBtn'),
  importStatus: document.getElementById('importStatus'),
  importConflictBox: document.getElementById('importConflictBox'),
  importConflicts: document.getElementById('importConflicts'),
  resolveAllDup: document.getElementById('resolveAllDup'),
  resolveOneDup: document.getElementById('resolveOneDup'),
  replaceExistingBtn: document.getElementById('replaceExistingBtn'),
  ignoreConflicts: document.getElementById('ignoreConflicts'),
  dupEditName: document.getElementById('dupEditName'),
  applyDupEdit: document.getElementById('applyDupEdit'),

  groupName: document.getElementById('groupName'),
  groupType: document.getElementById('groupType'),
  addGroup: document.getElementById('addGroup'),
  createComposePreset: document.getElementById('createComposePreset'),
  quickGroupBtn: document.getElementById('quickGroupBtn'),
  openNodeEditor: document.getElementById('openNodeEditor'),
  closeNodeEditor: document.getElementById('closeNodeEditor'),
  nodeEditorModal: document.getElementById('nodeEditorModal'),
  nodePool: document.getElementById('nodePool'),
  nodeEditorSelect: document.getElementById('nodeEditorSelect'),
  nodeEditorName: document.getElementById('nodeEditorName'),
  nodeEditorRegion: document.getElementById('nodeEditorRegion'),
  nodeEditorUrl: document.getElementById('nodeEditorUrl'),
  saveNodeMeta: document.getElementById('saveNodeMeta'),
  deleteNodeBtn: document.getElementById('deleteNodeBtn'),
  applyRegionModules: document.getElementById('applyRegionModules'),
  groups: document.getElementById('groups'),
  groupPool: document.getElementById('groupPool'),

  rules: document.getElementById('rules'),
  mixedPort: document.getElementById('mixedPort'),
  transitGroupName: document.getElementById('transitGroupName'),
  egressGroupName: document.getElementById('egressGroupName'),
  chainGroupName: document.getElementById('chainGroupName'),
  saveBtn: document.getElementById('saveBtn'),
  copyBtn: document.getElementById('copyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  downloadYamlBtn: document.getElementById('downloadYamlBtn'),
  publishBtn: document.getElementById('publishBtn'),
  generateSubBtn: document.getElementById('generateSubBtn'),
  copySubBtn: document.getElementById('copySubBtn'),
  autoFixBtn: document.getElementById('autoFixBtn'),
  presetAIBtn: document.getElementById('presetAIBtn'),
  presetMediaBtn: document.getElementById('presetMediaBtn'),
  presetDomesticBtn: document.getElementById('presetDomesticBtn'),
  presetResetBtn: document.getElementById('presetResetBtn'),
  subLinkOutput: document.getElementById('subLinkOutput'),
  resetBtn: document.getElementById('resetBtn'),
  publishStatus: document.getElementById('publishStatus'),
  markdown: document.getElementById('markdown'),
  warnings: document.getElementById('warnings'),
  publishChecklist: document.getElementById('publishChecklist'),
  diffSummary: document.getElementById('diffSummary'),
  publishHeroState: document.getElementById('publishHeroState'),
  publishHeroHint: document.getElementById('publishHeroHint'),
  publishBlockerCount: document.getElementById('publishBlockerCount'),
  publishWarningCount: document.getElementById('publishWarningCount'),
  qcRules: document.getElementById('qcRules'),
  qcNodes: document.getElementById('qcNodes'),
  qcPort: document.getElementById('qcPort'),
  doneImport: document.getElementById('doneImport'),
  doneGenerate: document.getElementById('doneGenerate'),
  donePublish: document.getElementById('donePublish'),
  composeUnassignedCount: document.getElementById('composeUnassignedCount'),
  composeTransitCount: document.getElementById('composeTransitCount'),
  composeEgressCount: document.getElementById('composeEgressCount'),
  composeChainCount: document.getElementById('composeChainCount'),
  checkUpdateBtn: document.getElementById('checkUpdateBtn'),
  smartUpdateBtn: document.getElementById('smartUpdateBtn'),
  copyUpdateCmdBtn: document.getElementById('copyUpdateCmdBtn'),
  updateStatus: document.getElementById('updateStatus'),
  exportDiffBtn: document.getElementById('exportDiffBtn'),
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

function setNodeEditorOpen(open) {
  if (!el.nodeEditorModal) return;
  el.nodeEditorModal.classList.toggle('hidden', !open);
  el.nodeEditorModal.setAttribute('aria-hidden', open ? 'false' : 'true');
}

function showAuth(message) {
  const hasAccount = !!getAuthConfig();
  el.authBtn.textContent = hasAccount ? '登录' : '开始使用';
  if (!message) {
    el.authTips.textContent = hasAccount
      ? '请输入已设置的用户名和密码登录。'
      : '首次使用：输入用户名和密码后点击“开始使用”。';
  } else {
    el.authTips.textContent = message;
  }
  el.authGate.classList.remove('hidden');
  el.appShell.classList.add('blurred');
}

function submitAuth() {
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
}

el.authBtn.addEventListener('click', submitAuth);
el.authUser.addEventListener('keydown', (e) => e.key === 'Enter' && submitAuth());
el.authPass.addEventListener('keydown', (e) => e.key === 'Enter' && submitAuth());
el.toggleAuthPass?.addEventListener('click', () => {
  const visible = el.authPass.type === 'text';
  el.authPass.type = visible ? 'password' : 'text';
  el.toggleAuthPass.textContent = visible ? '显示' : '隐藏';
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

function getWizardStep() {
  if (viewState.main === 'nodes') return 1;
  if (viewState.main === 'groups' || viewState.main === 'rules') return 2;
  return 3;
}

function updateWizardButtons(step) {
  const pairs = [el.wizStep1, el.wizStep2, el.wizStep3];
  pairs.forEach((btn, i) => btn?.classList.toggle('active', i + 1 === step));
}

function updatePathline() {
  const mainCfg = NAV_SCHEMA[viewState.main];
  const subCfg = mainCfg.subs[viewState.sub];
  const thirdLabel = subCfg.thirds[viewState.third];
  if (el.breadcrumbText) el.breadcrumbText.textContent = `路径：${mainCfg.label} / ${subCfg.label} / ${thirdLabel}`;

  const step = getWizardStep();
  if (el.stepProgressText) el.stepProgressText.textContent = `Step ${step} / 3`;
  if (el.stepProgressFill) el.stepProgressFill.style.width = `${(step / 3) * 100}%`;
  updateWizardButtons(step);
}

function getNavTriples() {
  const triples = [];
  Object.entries(NAV_SCHEMA).forEach(([mainId, mainCfg]) => {
    Object.entries(mainCfg.subs).forEach(([subId, subCfg]) => {
      Object.keys(subCfg.thirds).forEach((thirdId) => {
        triples.push({ main: mainId, sub: subId, third: thirdId });
      });
    });
  });
  return triples;
}

function jumpTo(main, sub, third) {
  const prevStep = getWizardStep();
  viewState.main = main;
  viewState.sub = sub;
  viewState.third = third;
  const nextStep = getWizardStep();
  if (el.flowStage) {
    el.flowStage.dataset.motion = nextStep < prevStep ? 'backward' : 'forward';
  }
  renderNavigation();
  renderPanes();
}

function renderPanes() {
  const direction = el.flowStage?.dataset.motion === 'backward' ? -1 : 1;
  document.querySelectorAll('.pane').forEach((pane) => {
    const main = pane.dataset.main;
    const step = main === 'nodes' ? 1 : main === 'publish' ? 3 : 2;
    const show = step === getWizardStep();
    pane.classList.toggle('active', show);
    pane.setAttribute('aria-hidden', show ? 'false' : 'true');

    if (show) {
      pane.hidden = false;
      pane.animate(
        [
          { opacity: 0, transform: `translateX(${16 * direction}px)` },
          { opacity: 1, transform: 'translateX(0)' },
        ],
        { duration: 220, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
      );
    } else if (!pane.hidden) {
      const anim = pane.animate(
        [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: `translateX(${-12 * direction}px)` },
        ],
        { duration: 160, easing: 'ease', fill: 'both' }
      );
      anim.onfinish = () => {
        if (!pane.classList.contains('active')) pane.hidden = true;
      };
    } else {
      pane.hidden = true;
    }
  });
  if (el.flowStage) el.flowStage.style.height = 'auto';
  updatePathline();
}

function mkNodeLi(node) {
  const li = document.createElement('li');
  li.className = 'item';
  li.dataset.id = node.id;
  li.dataset.key = `node:${node.id}`;
  li.dataset.kind = 'node';
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

function refreshConflictPanel() {
  if (!el.importConflictBox || !el.importConflicts) return;
  const conflictItems = [
    ...importConflictState.dupEntries.map((d) => `🔁 重名节点：${d.name}`),
    ...importConflictState.errors.map((e) => `⛔ ${e}`),
  ];
  el.importConflictBox.classList.toggle('hidden', conflictItems.length === 0);
  el.importConflicts.innerHTML = conflictItems.map((x) => `<li>${x}</li>`).join('');
  if (el.dupEditName) el.dupEditName.value = importConflictState.dupEntries[0]?.name ? `${importConflictState.dupEntries[0].name}-edited` : '';
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

function normalizeMemberKey(raw, kind = 'node') {
  if (!raw) return '';
  if (String(raw).startsWith('node:') || String(raw).startsWith('group:')) return String(raw);
  return `${kind}:${raw}`;
}

function syncFromDom() {
  state.groups.forEach((group) => {
    const ul = document.getElementById(`group-${group.id}`);
    if (!ul) return;
    group.members = [...ul.children].map((x) => normalizeMemberKey(x.dataset.key || x.dataset.id, x.dataset.kind || 'node'));
  });

  const chainGroup = state.groups.find((group) => group.name === (state.chainGroupName || 'Smart-Chain'));
  if (chainGroup) chainGroup.members = [];

  refreshMarkdownPreview();
  render();
  persistState();
}

function getSerializableState() {
  return {
    nodes: structuredClone(state.nodes),
    groups: structuredClone(state.groups),
    rules: el.rules.value.split('\n'),
    mixedPort: Number(el.mixedPort.value || state.mixedPort || 7892),
    transitGroupName: (el.transitGroupName?.value || state.transitGroupName || 'Smart-Transit').trim() || 'Smart-Transit',
    egressGroupName: (el.egressGroupName?.value || state.egressGroupName || 'Smart-Egress').trim() || 'Smart-Egress',
    chainGroupName: (el.chainGroupName?.value || state.chainGroupName || 'Smart-Chain').trim() || 'Smart-Chain',
    nodeUrls: el.nodeUrls.value || '',
    subUrls: el.subUrls?.value || '',
  };
}

function pushHistory(action = '编辑') {
  historyState.undo.push(getSerializableState());
  historyState.undoAction.push(action);
  if (historyState.undo.length > 50) {
    historyState.undo.shift();
    historyState.undoAction.shift();
  }
  historyState.redo = [];
  historyState.redoAction = [];
}

function applySnapshot(snap) {
  replaceState({
    nodes: snap.nodes || [],
    groups: snap.groups || [],
    rules: snap.rules || [],
    mixedPort: snap.mixedPort || 7892,
    transitGroupName: snap.transitGroupName || 'Smart-Transit',
    egressGroupName: snap.egressGroupName || 'Smart-Egress',
    chainGroupName: snap.chainGroupName || 'Smart-Chain',
  });
  el.nodeUrls.value = snap.nodeUrls || '';
  if (el.subUrls) el.subUrls.value = snap.subUrls || '';
  render();
  persistState();
}

function renderDiffSummary() {
  if (!el.diffSummary) return;
  if (!savedBaseline) {
    el.diffSummary.innerHTML = '<li class="ok">✅ 当前版本尚无基线，保存后将开始追踪差异</li>';
    return;
  }
  const curr = getSerializableState();
  const diffs = [];
  if (curr.nodes.length !== savedBaseline.nodes.length) diffs.push(`节点数量：${savedBaseline.nodes.length} → ${curr.nodes.length}`);
  if (curr.groups.length !== savedBaseline.groups.length) diffs.push(`策略组数量：${savedBaseline.groups.length} → ${curr.groups.length}`);

  const prevRules = savedBaseline.rules || [];
  const currRules = curr.rules || [];
  const addedRules = currRules.filter((r) => !prevRules.includes(r));
  const removedRules = prevRules.filter((r) => !currRules.includes(r));
  if (addedRules.length || removedRules.length) {
    diffs.push(`规则变更：+${addedRules.length} / -${removedRules.length}`);
    addedRules.slice(0, 2).forEach((r) => diffs.push(`规则新增：${r}`));
    removedRules.slice(0, 2).forEach((r) => diffs.push(`规则删除：${r}`));
  }

  if (curr.mixedPort !== savedBaseline.mixedPort) diffs.push(`mixed-port：${savedBaseline.mixedPort} → ${curr.mixedPort}`);
  el.diffSummary.innerHTML = diffs.length ? diffs.map((x) => `<li>🧾 ${x}</li>`).join('') : '<li class="ok">✅ 与上次保存相比无差异</li>';
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(getSerializableState()));
  renderDiffSummary();
}

function replaceState(nextState) {
  state.nodes.splice(0, state.nodes.length, ...((nextState.nodes || []).map((n) => ({ ...n, region: n.region || inferRegion(n.name) }))));
  state.groups.splice(0, state.groups.length, ...(nextState.groups || []));
  state.rules.splice(0, state.rules.length, ...(nextState.rules || []));
  state.mixedPort = Number(nextState.mixedPort || 7892);
  state.transitGroupName = nextState.transitGroupName || 'Smart-Transit';
  state.egressGroupName = nextState.egressGroupName || 'Smart-Egress';
  state.chainGroupName = nextState.chainGroupName || 'Smart-Chain';
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

  const transitGroupName = (el.transitGroupName?.value || state.transitGroupName || 'Smart-Transit').trim() || 'Smart-Transit';
  const egressGroupName = (el.egressGroupName?.value || state.egressGroupName || 'Smart-Egress').trim() || 'Smart-Egress';
  const chainGroupName = (el.chainGroupName?.value || state.chainGroupName || 'Smart-Chain').trim() || 'Smart-Chain';

  const transit = byName.get(transitGroupName) || { id: makeId(), name: transitGroupName, type: 'select', members: [] };
  transit.type = 'select';
  keep.push(transit);

  const egress = byName.get(egressGroupName) || { id: makeId(), name: egressGroupName, type: 'select', members: [] };
  egress.type = 'select';
  keep.push(egress);

  const chain = byName.get(chainGroupName) || { id: makeId(), name: chainGroupName, type: 'select', members: [] };
  chain.type = 'select';
  keep.push(chain);

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
    const nextGroups = Array.isArray(parsed.groups) ? parsed.groups : createDefaultState().groups;
    const filteredGroups = nextGroups.filter((group) => {
      if (group?.name !== 'Smart-HK') return true;
      return Array.isArray(group.members) && group.members.length > 0;
    });
    replaceState({
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : createDefaultState().nodes,
      groups: filteredGroups.length ? filteredGroups : createDefaultState().groups,
      rules: Array.isArray(parsed.rules) ? parsed.rules : createDefaultState().rules,
      mixedPort: parsed.mixedPort || 7892,
      transitGroupName: parsed.transitGroupName || 'Smart-Transit',
      egressGroupName: parsed.egressGroupName || 'Smart-Egress',
      chainGroupName: parsed.chainGroupName || 'Smart-Chain',
    });
    if (typeof parsed.nodeUrls === 'string') el.nodeUrls.value = parsed.nodeUrls;
    if (typeof parsed.subUrls === 'string' && el.subUrls) el.subUrls.value = parsed.subUrls;
  } catch {
    // ignore
  }
}

function makeGroupRefLi(group) {
  const li = document.createElement('li');
  li.className = 'item group-ref';
  li.dataset.key = `group:${group.id}`;
  li.dataset.kind = 'group';
  li.textContent = `🧩 ${group.name} (${group.type})`;
  return li;
}

function ensureComposeGroup(name, type = 'select') {
  const finalName = (name || '').trim();
  if (!finalName) return null;
  let group = state.groups.find((g) => g.name === finalName);
  if (!group) {
    group = { id: makeId(), name: finalName, type, members: [] };
    state.groups.push(group);
  } else if (type) {
    group.type = type;
  }
  return group;
}

function removeMemberFromGroup(groupId, memberKey) {
  const group = state.groups.find((item) => item.id === groupId);
  if (!group) return;
  const idx = (group.members || []).findIndex((item) => String(item) === String(memberKey));
  if (idx >= 0) group.members.splice(idx, 1);
}

function deleteNodeEverywhere(nodeId) {
  state.nodes = state.nodes.filter((n) => n.id !== nodeId);
  state.groups.forEach((g) => {
    g.members = (g.members || []).filter((member) => {
      const key = String(member || '');
      const memberNodeId = key.startsWith('node:') ? key.slice(5) : key;
      return memberNodeId !== nodeId;
    });
  });
}

function quickGroupNodes() {
  pushHistory('一键分组');
  const transitGroup = state.groups.find((g) => g.name === (state.transitGroupName || '中转组'));
  const egressGroup = state.groups.find((g) => g.name === (state.egressGroupName || '落地组'));
  const chainGroup = state.groups.find((g) => g.name === (state.chainGroupName || '链式组'));
  if (!transitGroup || !egressGroup || !chainGroup) {
    setPublishStatus('一键分组前，请先选择已存在的中转组、落地组和链式组', 'error');
    return;
  }
  const regionPriority = ['HK', 'SG', 'JP', 'US', 'OTHER', 'AUTO'];
  const ordered = state.nodes.slice().sort((a, b) => regionPriority.indexOf(a.region || 'AUTO') - regionPriority.indexOf(b.region || 'AUTO'));
  const transitIds = [];
  const egressIds = [];
  ordered.forEach((node, index) => {
    const key = `node:${node.id}`;
    if (index % 2 === 0) transitIds.push(key);
    else egressIds.push(key);
  });
  if (!egressIds.length && transitIds.length > 1) egressIds.push(transitIds.pop());
  transitGroup.members = transitIds;
  egressGroup.members = egressIds;
  chainGroup.members = [];
  render();
  persistState();
  setPublishStatus(`已一键分组：中转 ${transitIds.length} 个，落地 ${egressIds.length} 个`, 'success');
}

function render() {
  const transitGroupName = state.transitGroupName || 'Smart-Transit';
  const egressGroupName = state.egressGroupName || 'Smart-Egress';
  const chainGroupName = state.chainGroupName || 'Smart-Chain';
  const guaranteed = [
    { name: 'Smart-AUTO', type: 'smart' },
    { name: transitGroupName, type: 'select' },
    { name: egressGroupName, type: 'select' },
    { name: chainGroupName, type: 'select' },
  ];
  guaranteed.forEach(({ name, type }) => ensureComposeGroup(name, type));

  el.nodePool.innerHTML = '';
  if (el.groupPool) el.groupPool.innerHTML = '';
  const availableNodes = state.nodes.slice();
  availableNodes.forEach((n) => {
    const li = mkNodeLi(n);
    li.insertAdjacentHTML('beforeend', '<button class="member-remove-btn node-delete-btn" type="button" title="删除节点">×</button>');
    li.querySelector('.node-delete-btn')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      pushHistory('删除节点');
      deleteNodeEverywhere(n.id);
      render();
      persistState();
      setImportStatus(`已删除节点：${n.name}`, 'success');
    });
    el.nodePool.appendChild(li);
  });

  const preferredOrder = [transitGroupName, egressGroupName, chainGroupName, 'Smart-AUTO'];
  const orderedGroups = [
    ...preferredOrder.map((name) => state.groups.find((g) => g.name === name)).filter(Boolean),
    ...state.groups.filter((g) => !preferredOrder.includes(g.name)),
  ];

  el.groups.innerHTML = '';
  state.groups.splice(0, state.groups.length, ...orderedGroups);
  state.groups.forEach((g) => {
    const box = document.createElement('article');
    box.className = 'group';
    box.dataset.id = g.id;
    const memberCount = Array.isArray(g.members) ? g.members.length : 0;
    const canDelete = g.name !== 'Smart-AUTO';
    box.innerHTML = `<div class="group-head"><h4>${g.name} <small>(${g.type}) · ${memberCount} 项</small></h4><div class="group-actions">${canDelete ? '<button class="ghost group-action-btn" data-action="delete-group">删除组</button>' : ''}</div></div><ul class="list" id="group-${g.id}"></ul>`;
    const ul = box.querySelector('ul');
    (g.members || []).forEach((member) => {
      const key = String(member || '');
      let li = null;
      if (key.startsWith('group:')) {
        const ref = state.groups.find((item) => item.id === key.slice(6));
        if (ref) li = makeGroupRefLi(ref);
      } else {
        const nodeId = key.startsWith('node:') ? key.slice(5) : key;
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) li = mkNodeLi(node);
      }
      if (!li) return;
      li.dataset.memberKey = key;
      li.insertAdjacentHTML('beforeend', '<button class="member-remove-btn" type="button" title="移出当前组">×</button>');
      li.querySelector('.member-remove-btn')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        pushHistory('移出组成员');
        removeMemberFromGroup(g.id, key);
        render();
        persistState();
      });
      ul.appendChild(li);
    });
    const deleteBtn = box.querySelector('[data-action="delete-group"]');
    deleteBtn?.addEventListener('click', () => {
      const fallbackGroup = state.groups.find((item) => item.id !== g.id && item.name !== 'Smart-AUTO') || state.groups.find((item) => item.name === 'Smart-AUTO');
      state.groups.forEach((group) => {
        group.members = (group.members || []).filter((member) => String(member) !== `group:${g.id}`);
      });
      state.groups.splice(state.groups.findIndex((item) => item.id === g.id), 1);
      if (state.transitGroupName === g.name) state.transitGroupName = fallbackGroup?.name || 'Smart-Transit';
      if (state.egressGroupName === g.name) state.egressGroupName = fallbackGroup?.name || 'Smart-Egress';
      if (state.chainGroupName === g.name) state.chainGroupName = fallbackGroup?.name || 'Smart-Chain';
      render();
      persistState();
      setPublishStatus(`已删除组：${g.name}`, 'success');
    });
    el.groups.appendChild(box);
    new Sortable(ul, { group: { name: 'nodes-and-groups', pull: true, put: true }, animation: 150, onSort: syncFromDom });
    if (el.groupPool && !['Smart-AUTO', transitGroupName, egressGroupName, chainGroupName].includes(g.name)) {
      const refLi = makeGroupRefLi(g);
      refLi.insertAdjacentHTML('beforeend', '<button class="member-remove-btn group-ref-delete-btn" type="button" title="删除该组">×</button>');
      refLi.querySelector('.group-ref-delete-btn')?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        pushHistory('删除组');
        const fallbackGroup = state.groups.find((item) => item.id !== g.id && item.name !== 'Smart-AUTO') || state.groups.find((item) => item.name === 'Smart-AUTO');
        state.groups.forEach((group) => {
          group.members = (group.members || []).filter((member) => String(member) !== `group:${g.id}`);
        });
        state.groups.splice(state.groups.findIndex((item) => item.id === g.id), 1);
        if (state.transitGroupName === g.name) state.transitGroupName = fallbackGroup?.name || 'Smart-Transit';
        if (state.egressGroupName === g.name) state.egressGroupName = fallbackGroup?.name || 'Smart-Egress';
        if (state.chainGroupName === g.name) state.chainGroupName = fallbackGroup?.name || 'Smart-Chain';
        render();
        persistState();
        setPublishStatus(`已删除组：${g.name}`, 'success');
      });
      el.groupPool.appendChild(refLi);
    }
  });

  new Sortable(el.nodePool, { group: { name: 'nodes-and-groups', pull: 'clone', put: false }, animation: 150, sort: false, onSort: syncFromDom, onEnd: render });
  if (el.groupPool) new Sortable(el.groupPool, { group: { name: 'nodes-and-groups', pull: 'clone', put: false }, animation: 150, sort: false, onSort: syncFromDom, onEnd: render });
  new Sortable(el.groups, { animation: 150, handle: 'h4', onSort: syncGroupOrder });

  const transitNames = getGroupProxyNames(transitGroupName);
  const egressNames = getGroupProxyNames(egressGroupName);
  const transitMembers = transitNames.length;
  const egressMembers = egressNames.length;
  const chainGroup = state.groups.find((g) => g.name === chainGroupName);
  const chainCount = transitMembers && egressMembers ? Math.min(transitMembers, 8) * Math.min(egressMembers, 8) : 0;
  if (chainGroup) {
    chainGroup.members = [];
    let combo = 0;
    for (const t of transitNames.slice(0, 8)) {
      for (const e of egressNames.slice(0, 8)) {
        combo += 1;
        chainGroup.members.push(`relay:${t}=>${e}#${combo}`);
      }
    }
  }
  if (el.composeUnassignedCount) el.composeUnassignedCount.textContent = String(availableNodes.length);
  if (el.composeTransitCount) el.composeTransitCount.textContent = String(transitMembers);
  if (el.composeEgressCount) el.composeEgressCount.textContent = String(egressMembers);
  if (el.composeChainCount) el.composeChainCount.textContent = chainCount ? `${chainCount}` : '0';
  const routeLiveTransit = document.getElementById('routeLiveTransit');
  const routeLiveEgress = document.getElementById('routeLiveEgress');
  const routeLiveStatus = document.getElementById('routeLiveStatus');
  if (routeLiveTransit) routeLiveTransit.textContent = transitGroupName;
  if (routeLiveEgress) routeLiveEgress.textContent = egressGroupName;
  if (routeLiveStatus) routeLiveStatus.textContent = transitMembers && egressMembers ? `已生成 ${chainCount} 条组合` : '待放入中转 / 落地节点';

  el.rules.value = state.rules.join('\n');
  el.mixedPort.value = state.mixedPort;
  const groupOptions = state.groups.map((g) => `<option value="${g.name}">${g.name} (${g.type})</option>`).join('');
  if (el.transitGroupName) {
    el.transitGroupName.innerHTML = groupOptions;
    el.transitGroupName.value = transitGroupName;
  }
  if (el.egressGroupName) {
    el.egressGroupName.innerHTML = groupOptions;
    el.egressGroupName.value = egressGroupName;
  }
  if (el.chainGroupName) {
    el.chainGroupName.innerHTML = groupOptions;
    el.chainGroupName.value = chainGroupName;
  }
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

function resolveGroupMembers(group, seen = new Set()) {
  if (!group || seen.has(group.id)) return [];
  seen.add(group.id);
  const proxies = [];
  (group.members || []).forEach((member) => {
    const key = String(member || '');
    if (key.startsWith('group:')) {
      const ref = state.groups.find((g) => g.id === key.slice(6));
      if (ref) proxies.push(ref.name);
      return;
    }
    if (key.startsWith('relay:')) return;
    const nodeId = key.startsWith('node:') ? key.slice(5) : key;
    const node = state.nodes.find((item) => item.id === nodeId);
    if (node) proxies.push(node.name);
  });
  return proxies;
}

function buildProxyGroup(group, names) {
  const proxies = resolveGroupMembers(group);
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

function getGroupProxyNames(groupName) {
  const group = state.groups.find((g) => g.name === groupName);
  if (!group) return [];
  return resolveGroupMembers(group);
}

function injectChainGroups(proxyGroups) {
  const transitGroupName = (el.transitGroupName?.value || state.transitGroupName || 'Smart-Transit').trim() || 'Smart-Transit';
  const egressGroupName = (el.egressGroupName?.value || state.egressGroupName || 'Smart-Egress').trim() || 'Smart-Egress';
  const chainGroupName = (el.chainGroupName?.value || state.chainGroupName || 'Smart-Chain').trim() || 'Smart-Chain';

  const transit = getGroupProxyNames(transitGroupName);
  const egress = getGroupProxyNames(egressGroupName);

  if (!transit.length || !egress.length) return;

  const chains = [];
  let combo = 0;
  for (const t of transit.slice(0, 8)) {
    for (const e of egress.slice(0, 8)) {
      combo += 1;
      const name = `${chainGroupName}-${combo}`;
      proxyGroups.push({ name, type: 'relay', proxies: [t, e] });
      chains.push(name);
    }
  }

  if (chains.length) {
    const chainIdx = proxyGroups.findIndex((g) => g.name === chainGroupName);
    if (chainIdx >= 0) proxyGroups[chainIdx] = { name: chainGroupName, type: 'select', proxies: chains };
    else proxyGroups.push({ name: chainGroupName, type: 'select', proxies: chains });
  }
}

function buildYamlObject() {
  const proxies = state.nodes.map((node, index) => buildProxyFromNode(node, index));
  const proxyNames = proxies.map((proxy) => proxy.name);
  const proxyGroups = state.groups.map((group) => buildProxyGroup(group, proxyNames));

  injectChainGroups(proxyGroups);

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
  const risks = [];
  const knownNodeIds = new Set(state.nodes.map((n) => n.id));
  const knownGroupIds = new Set(state.groups.map((g) => g.id));
  const knownGroupNames = new Set(state.groups.map((g) => g.name));
  knownGroupNames.add((el.transitGroupName?.value || state.transitGroupName || 'Smart-Transit').trim() || 'Smart-Transit');
  knownGroupNames.add((el.egressGroupName?.value || state.egressGroupName || 'Smart-Egress').trim() || 'Smart-Egress');
  knownGroupNames.add((el.chainGroupName?.value || state.chainGroupName || 'Smart-Chain').trim() || 'Smart-Chain');

  state.groups.forEach((g) => {
    if (g.type === 'smart' && g.members.length === 0) {
      warnings.push(`分组「${g.name}」现在是空的`);
      blockers.push(`分组「${g.name}」还没有节点，当前不能发布`);
      risks.push(`高风险：分组「${g.name}」为空，导出后这条分流会失效`);
      suggestions.push(`给分组「${g.name}」至少放入 1 个节点后再发布`);
    }
    g.members.forEach((id) => {
      const key = String(id || '');
      if (key.startsWith('relay:')) return;
      if (key.startsWith('group:')) {
        const groupId = key.slice(6);
        if (!knownGroupIds.has(groupId)) {
          warnings.push(`分组「${g.name}」里有一个已经被删掉的组引用`);
          blockers.push(`分组「${g.name}」里有失效组引用，当前不能发布`);
        }
        return;
      }
      const nodeId = key.startsWith('node:') ? key.slice(5) : key;
      if (!knownNodeIds.has(nodeId)) {
        warnings.push(`分组「${g.name}」里有一个已经被删掉的节点`);
        blockers.push(`分组「${g.name}」里有失效节点引用，当前不能发布`);
      }
    });
  });

  const lines = el.rules.value.split('\n').map((x) => x.trim()).filter(Boolean);
  lines.forEach((line, i) => {
    const segs = line.split(',').map((s) => s.trim()).filter(Boolean);
    if (segs.length < 2) {
      blockers.push(`规则第 ${i + 1} 行格式不对，当前不能发布`);
      suggestions.push(`规则第 ${i + 1} 行至少要写成“类型,值[,分组]”`);
      return;
    }
    if (segs.length >= 3) {
      const target = segs[2];
      if (target !== 'DIRECT' && !knownGroupNames.has(target)) {
        blockers.push(`规则第 ${i + 1} 行指向了一个不存在的分组，当前不能发布`);
        suggestions.push(`把规则第 ${i + 1} 行改到现有分组，或改成 Smart-AUTO`);
      }
    }
  });

  state.nodes.forEach((node, index) => {
    if (!node.url) {
      warnings.push(`节点「${node.name}」还没填真实链接，导出时会变成占位内容`);
      return;
    }
    try {
      buildProxyFromNode(node, index);
    } catch (error) {
      blockers.push(`节点「${node.name}」链接解析失败：${error.message}`);
      suggestions.push(`先修正节点「${node.name}」的协议或参数，再发布`);
    }
  });

  const p = Number(el.mixedPort.value || 0);
  if (!Number.isInteger(p) || p < 1 || p > 65535) {
    blockers.push('端口填写不合法，当前不能发布');
    risks.push('高风险：端口不合法会导致配置无法启动');
    suggestions.push('把 mixed-port 改成 1-65535 的整数（建议 7892）');
  }

  const lines2 = el.rules.value.split('\n').map((x) => x.trim()).filter(Boolean);
  if (!lines2.some((r) => r.startsWith('MATCH,'))) {
    risks.push('高风险：缺少 MATCH 兜底规则，可能会有流量找不到出口');
  }

  const transitGroupName = (el.transitGroupName?.value || state.transitGroupName || 'Smart-Transit').trim() || 'Smart-Transit';
  const egressGroupName = (el.egressGroupName?.value || state.egressGroupName || 'Smart-Egress').trim() || 'Smart-Egress';
  const transitCount = getGroupProxyNames(transitGroupName).length;
  const egressCount = getGroupProxyNames(egressGroupName).length;
  if (!transitCount || !egressCount) {
    suggestions.push(`链式分组还没激活：先往「${transitGroupName}」放中转节点，再往「${egressGroupName}」放落地节点`);
  } else {
    suggestions.push(`链式分组已就绪：当前会按「${transitGroupName} → ${egressGroupName}」自动生成组合`);
  }

  return { warnings, blockers, suggestions, risks };
}

function updateSmartActionLabel(result) {
  if (!el.smartActionBtn) return;
  const hasImported = state.nodes.some((n) => n.url);
  const smart = state.groups.find((g) => g.name === 'Smart-AUTO');
  const hasGenerated = !!(smart?.members?.length);
  const canPublish = result.blockers.length === 0;

  if (!hasImported) {
    el.smartActionBtn.textContent = '继续下一步：先导入节点';
    return;
  }
  if (!hasGenerated) {
    el.smartActionBtn.textContent = '继续下一步：生成模块';
    return;
  }
  if (!canPublish) {
    el.smartActionBtn.textContent = '继续下一步：修复后发布';
    return;
  }
  el.smartActionBtn.textContent = '继续下一步：发布配置';
}

function renderQuickChecks(result) {
  if (el.qcRules) el.qcRules.textContent = result.blockers.length ? `有 ${result.blockers.length} 条阻塞` : '规则无阻塞';
  const smart = state.groups.find((g) => g.name === 'Smart-AUTO');
  if (el.qcNodes) el.qcNodes.textContent = smart?.members?.length ? `Smart-AUTO 已分配 ${smart.members.length} 节点` : 'Smart-AUTO 暂无节点';
  const p = Number(el.mixedPort.value || 0);
  if (el.qcPort) el.qcPort.textContent = Number.isInteger(p) && p >= 1 && p <= 65535 ? `端口 ${p} 有效` : '端口无效';

  if (el.doneImport) el.doneImport.textContent = state.nodes.some((n) => n.url) ? '✅ 已完成' : '⏳ 未完成';
  if (el.doneGenerate) el.doneGenerate.textContent = smart?.members?.length ? '✅ 已完成' : '⏳ 未完成';
  if (el.donePublish) el.donePublish.textContent = result.blockers.length ? '⏳ 待处理' : '✅ 可发布';
  if (el.publishBlockerCount) el.publishBlockerCount.textContent = String(result.blockers.length);
  if (el.publishWarningCount) el.publishWarningCount.textContent = String(result.warnings.length);
  if (el.publishHeroState) {
    el.publishHeroState.textContent = result.blockers.length ? '需修复后发布' : '可以进入发布';
  }
  if (el.publishHeroHint) {
    el.publishHeroHint.textContent = result.blockers.length
      ? `还有 ${result.blockers.length} 个问题必须先修，修完再导出`
      : result.warnings.length
        ? `当前可以继续，但还有 ${result.warnings.length} 条提醒建议处理`
        : '当前状态正常，可以直接保存、导出或发布';
  }
  updateSmartActionLabel(result);
}

function renderWarnings(result) {
  const items = [];
  result.blockers.forEach((x) => items.push(`<li>⛔ ${x}</li>`));
  result.warnings.forEach((x) => items.push(`<li>⚠️ ${x}</li>`));
  result.suggestions.forEach((x) => items.push(`<li>💡 ${x}</li>`));
  result.risks?.forEach((x) => items.push(`<li>🚨 ${x}</li>`));
  el.warnings.innerHTML = items.length ? items.join('') : '<li class="ok">✅ 状态校验通过，可保存可发布</li>';
  renderQuickChecks(result);

  if (el.publishChecklist) {
    const checks = [
      {
        text: result.blockers.length ? `⛔ 还有 ${result.blockers.length} 个问题必须先修` : '✅ 当前没有阻塞项，可以发布',
        jump: 'nodes/import/quick',
      },
      {
        text: result.warnings.length ? `⚠️ 还有 ${result.warnings.length} 条提醒，建议看一眼` : '✅ 当前没有提醒项',
        jump: 'rules/editor/line',
      },
      { text: '📦 导出格式已确认：YAML + Markdown', jump: 'publish/actions/output' },
      { text: '🧪 规则、节点、分组引用已完成一致性检查', jump: 'rules/editor/line' },
      {
        text: result.risks?.length ? `🚨 还有 ${result.risks.length} 个高风险点，建议逐项确认` : '✅ 当前没有高风险项',
        jump: 'rules/editor/line',
      },
    ];
    el.publishChecklist.innerHTML = checks.map((x) => `<li data-jump="${x.jump}">${x.text}</li>`).join('');
    el.publishChecklist.querySelectorAll('li[data-jump]').forEach((li) => {
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        const [m, s, t] = li.dataset.jump.split('/');
        jumpTo(m, s, t);
      });
    });
  }
}

function refreshMarkdownPreview() {
  if (!el.markdown.dataset.manualEdit) el.markdown.value = buildMarkdown();
  renderWarnings(validateState());
}

function setPublishStatus(text, type = 'idle') {
  el.publishStatus.textContent = text;
  el.publishStatus.dataset.type = type;
}

function setSubFetchStatus(text, type = 'idle') {
  if (!el.subFetchStatus) return;
  el.subFetchStatus.textContent = text;
  el.subFetchStatus.dataset.type = type;
}

async function checkUpdate() {
  if (!el.updateStatus) return;
  el.updateStatus.textContent = '正在检查更新...';
  try {
    const resp = await fetch('/api/version', { cache: 'no-store' });
    const data = await resp.json();
    const local = data.local || APP_VERSION;
    const latest = data.latest;
    if (!latest) throw new Error('empty version');
    if (latest === local) {
      el.updateStatus.textContent = `已是最新版本 v${local}`;
    } else {
      el.updateStatus.textContent = `发现新版本 v${latest}（当前 v${local}）`;
    }
  } catch {
    try {
      const resp = await fetch('https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main/VERSION', { cache: 'no-store' });
      const latest = (await resp.text()).trim();
      if (!latest) throw new Error('empty');
      el.updateStatus.textContent = latest === APP_VERSION
        ? `已是最新版本 v${APP_VERSION}`
        : `发现新版本 v${latest}（当前 v${APP_VERSION}）`;
    } catch {
      el.updateStatus.textContent = '检查更新失败，请稍后重试';
    }
  }
}

el.addNode.addEventListener('click', () => {
  const name = el.nodeName.value.trim();
  if (!name) return;
  pushHistory();
  state.nodes.push({ id: makeId(), name, url: '', region: inferRegion(name) });
  el.nodeName.value = '';
  render();
  persistState();
});

el.fetchSubsBtn?.addEventListener('click', async () => {
  const urls = (el.subUrls?.value || '').split('\n').map((x) => x.trim()).filter(Boolean);
  if (!urls.length) return setSubFetchStatus('请先填写订阅链接', 'error');

  setSubFetchStatus('正在拉取订阅...', 'idle');
  try {
    const resp = await fetch('/api/subscriptions/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    });
    const data = await resp.json();
    const lines = Array.isArray(data.lines) ? data.lines : [];
    if (!lines.length) {
      const tip = (data.errors && data.errors.length) ? `，错误 ${data.errors.length} 条` : '';
      return setSubFetchStatus(`未拉到可用节点${tip}`, 'error');
    }

    const old = (el.nodeUrls.value || '').split('\n').map((x) => x.trim()).filter(Boolean);
    const merged = [...new Set([...old, ...lines])];
    el.nodeUrls.value = merged.join('\n');
    persistState();
    setSubFetchStatus(`拉取完成：${lines.length} 条（已填充到节点 URL 区）`, 'success');
  } catch {
    setSubFetchStatus('拉取失败，请确认使用 dev_server.py 启动网页', 'error');
  }
});

el.importUrlsBtn.addEventListener('click', () => {
  const lines = el.nodeUrls.value.split('\n').map((x) => x.trim()).filter(Boolean);
  if (!lines.length) return setImportStatus('请先粘贴节点 URL 或先拉取订阅', 'error');
  setImportStatus('正在导入节点并分析冲突...', 'idle');
  pushHistory();

  const exists = new Set(state.nodes.map((n) => n.name));
  let okCount = 0;
  let dupCount = 0;
  const errors = [];
  const dupEntries = [];

  lines.forEach((line, i) => {
    const parsed = parseNodeUrl(line, i);
    if (!parsed) return;
    if (!parsed.ok) return errors.push(parsed.error);
    if (exists.has(parsed.name)) {
      dupCount++;
      dupEntries.push(parsed);
      return;
    }
    exists.add(parsed.name);
    state.nodes.push({ id: makeId(), name: parsed.name, url: parsed.url, region: inferRegion(parsed.name) });
    okCount++;
  });
  importConflictState.dupEntries = dupEntries;
  importConflictState.errors = errors;

  render();
  persistState();

  refreshConflictPanel();

  if (errors.length || dupCount) {
    setImportStatus(`导入 ${okCount}，重复 ${dupCount}，失败 ${errors.length}｜可点“自动处理重复”后进入编排区`, 'error');
  } else {
    setImportStatus(`导入成功 ${okCount} 条｜已自动切到编排区`, 'success');
    jumpTo('groups', 'canvas', 'drag');
    setPublishStatus('开始第 2 步：把节点拖入中转组 / 落地组', 'success');
  }
});

el.addGroup.addEventListener('click', () => {
  const name = el.groupName.value.trim();
  if (!name) return;
  pushHistory();
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

el.openNodeEditor?.addEventListener('click', () => {
  syncNodeEditorOptions();
  setNodeEditorOpen(true);
});

el.closeNodeEditor?.addEventListener('click', () => setNodeEditorOpen(false));

el.saveNodeMeta?.addEventListener('click', () => {
  const selected = state.nodes.find((n) => n.id === el.nodeEditorSelect.value);
  if (!selected) return;
  pushHistory();
  selected.name = el.nodeEditorName.value.trim() || selected.name;
  selected.url = el.nodeEditorUrl.value.trim();
  selected.region = el.nodeEditorRegion.value || inferRegion(selected.name);
  render();
  persistState();
  setImportStatus(`已更新节点：${selected.name}`, 'success');
});

el.deleteNodeBtn?.addEventListener('click', () => {
  const id = el.nodeEditorSelect?.value;
  const node = state.nodes.find((n) => n.id === id);
  if (!id || !node) return setImportStatus('没有可删除的节点', 'error');
  pushHistory();
  deleteNodeEverywhere(id);
  render();
  persistState();
  if (!state.nodes.length) setNodeEditorOpen(false);
  setImportStatus(`已删除节点：${node.name}`, 'success');
});

el.applyRegionModules?.addEventListener('click', () => {
  pushHistory();
  applyRegionModulesFromNodes();
  render();
  persistState();
  setPublishStatus('已按节点分区重建策略组模块（Smart-AUTO + Transit/Egress/Chain）', 'success');
});

el.clearUrlsBtn.addEventListener('click', () => {
  pushHistory();
  state.nodes.forEach((node) => {
    node.url = '';
  });
  el.nodeUrls.value = '';
  render();
  persistState();
  importConflictState.dupEntries = [];
  importConflictState.errors = [];
  refreshConflictPanel();
  setImportStatus('已清空已导入 URL', 'idle');
  setPublishStatus('已清空节点 URL，请重新导入后再发布', 'idle');
});

el.resolveAllDup?.addEventListener('click', () => {
  if (!importConflictState.dupEntries.length) return setImportStatus('没有待处理的重复节点', 'idle');
  pushHistory();
  const exists = new Set(state.nodes.map((n) => n.name));
  let imported = 0;
  importConflictState.dupEntries.forEach((item) => {
    let idx = 2;
    let name = `${item.name}-dup${idx}`;
    while (exists.has(name)) {
      idx += 1;
      name = `${item.name}-dup${idx}`;
    }
    exists.add(name);
    state.nodes.push({ id: makeId(), name, url: item.url, region: inferRegion(name) });
    imported += 1;
  });
  importConflictState.dupEntries = [];
  render();
  persistState();
  refreshConflictPanel();
  setImportStatus(`重复节点已重命名导入 ${imported} 条`, 'success');
});

el.resolveOneDup?.addEventListener('click', () => {
  if (!importConflictState.dupEntries.length) return setImportStatus('没有待处理的重复节点', 'idle');
  pushHistory();
  const item = importConflictState.dupEntries.shift();
  const exists = new Set(state.nodes.map((n) => n.name));
  let idx = 2;
  let name = `${item.name}-dup${idx}`;
  while (exists.has(name)) {
    idx += 1;
    name = `${item.name}-dup${idx}`;
  }
  state.nodes.push({ id: makeId(), name, url: item.url, region: inferRegion(name) });
  render();
  persistState();
  refreshConflictPanel();
  setImportStatus(`已处理 1 条重复节点，剩余 ${importConflictState.dupEntries.length} 条`, 'success');
});

el.applyDupEdit?.addEventListener('click', () => {
  if (!importConflictState.dupEntries.length) return setImportStatus('没有待编辑的重复节点', 'idle');
  const customName = (el.dupEditName?.value || '').trim();
  if (!customName) return setImportStatus('请先输入新名称', 'error');
  pushHistory('逐条冲突编辑');
  const item = importConflictState.dupEntries.shift();
  const exists = new Set(state.nodes.map((n) => n.name));
  let finalName = customName;
  let i = 2;
  while (exists.has(finalName)) {
    finalName = `${customName}-${i++}`;
  }
  state.nodes.push({ id: makeId(), name: finalName, url: item.url, region: inferRegion(finalName) });
  render();
  persistState();
  refreshConflictPanel();
  setImportStatus(`已按自定义名称导入：${finalName}`, 'success');
});

el.replaceExistingBtn?.addEventListener('click', () => {
  if (!importConflictState.dupEntries.length) return setImportStatus('没有可替换的重复节点', 'idle');
  pushHistory('替换同名节点URL');
  const item = importConflictState.dupEntries.shift();
  const target = state.nodes.find((n) => n.name === item.name);
  if (target) {
    target.url = item.url;
    target.region = inferRegion(target.name);
    setImportStatus(`已替换同名节点 URL：${item.name}`, 'success');
  } else {
    state.nodes.push({ id: makeId(), name: item.name, url: item.url, region: inferRegion(item.name) });
    setImportStatus(`未找到同名节点，已新建：${item.name}`, 'success');
  }
  render();
  persistState();
  refreshConflictPanel();
});

el.ignoreConflicts?.addEventListener('click', () => {
  importConflictState.dupEntries = [];
  importConflictState.errors = [];
  refreshConflictPanel();
  setImportStatus('已忽略当前冲突提示', 'idle');
});

el.saveBtn.addEventListener('click', () => {
  const result = validateState();
  renderWarnings(result);
  el.markdown.dataset.manualEdit = '';
  el.markdown.value = buildMarkdown();
  state.mixedPort = Number(el.mixedPort.value || 7892);
  savedBaseline = getSerializableState();
  persistState();
  setPublishStatus('已保存最新 Markdown，等待发布', 'idle');
});

async function generateSubscriptionLink() {
  const result = validateState();
  renderWarnings(result);
  if (result.blockers.length) {
    const summary = result.blockers.slice(0, 2).join('；');
    setPublishStatus(`现在还不能生成订阅：有 ${result.blockers.length} 个必须先修的问题。${summary}${result.blockers.length > 2 ? '…' : ''}`, 'error');
    return null;
  }
  const yaml = jsyaml.dump(buildYamlObject(), { noRefs: true });
  const resp = await fetch('/api/subscription/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ yaml }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.ok || !data.url) throw new Error(data.error || '生成失败');
  if (el.subLinkOutput) el.subLinkOutput.value = data.url;
  setPublishStatus(`订阅链接已生成，可直接给 Clash 使用`, 'success');
  return data.url;
}

el.publishBtn.addEventListener('click', () => {
  const result = validateState();
  renderWarnings(result);
  if (result.blockers.length) {
    const summary = result.blockers.slice(0, 2).join('；');
    return setPublishStatus(`现在还不能发布：有 ${result.blockers.length} 个必须先修的问题。${summary}${result.blockers.length > 2 ? '…' : ''}`, 'error');
  }
  persistState();
  setPublishStatus(result.warnings.length ? `可以发布，另外还有 ${result.warnings.length} 条提醒可按需处理` : '发布检查通过：现在可以直接导出或发布', 'success');
});

el.generateSubBtn?.addEventListener('click', async () => {
  try {
    await generateSubscriptionLink();
  } catch (error) {
    setPublishStatus(`生成订阅链接失败：${error.message}`, 'error');
  }
});

el.copySubBtn?.addEventListener('click', async () => {
  try {
    const url = el.subLinkOutput?.value || await generateSubscriptionLink();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setPublishStatus('订阅链接已复制，可直接粘贴到 Clash', 'success');
  } catch (error) {
    setPublishStatus(`复制订阅链接失败：${error.message}`, 'error');
  }
});

el.copyBtn?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(el.markdown.value);
  el.copyBtn.textContent = '已复制 ✅';
  setTimeout(() => (el.copyBtn.textContent = '复制 Markdown'), 1200);
});

el.downloadBtn?.addEventListener('click', () => {
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

el.exportDiffBtn?.addEventListener('click', () => {
  const text = (el.diffSummary?.innerText || '暂无变更').trim();
  const report = `# smartclash-gen 变更报告\n\n${text}\n`;
  const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smartclash-diff-report.md';
  a.click();
  URL.revokeObjectURL(url);
});

function applyRulePreset(lines, label) {
  pushHistory(`规则预设：${label}`);
  el.rules.value = lines.join('\n');
  state.rules = [...lines];
  refreshMarkdownPreview();
  persistState();
  setPublishStatus(`已套用规则预设：${label}`, 'success');
}

el.presetAIBtn?.addEventListener('click', () => applyRulePreset(RULE_PRESETS.ai, 'AI 常用'));
el.presetMediaBtn?.addEventListener('click', () => applyRulePreset(RULE_PRESETS.media, '流媒体常用'));
el.presetDomesticBtn?.addEventListener('click', () => applyRulePreset(RULE_PRESETS.domestic, '国内直连'));
el.presetResetBtn?.addEventListener('click', () => applyRulePreset(DEFAULT_RULE_LINES, '恢复默认规则'));

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

el.transitGroupName?.addEventListener('change', () => {
  state.transitGroupName = (el.transitGroupName.value || 'Smart-Transit').trim() || 'Smart-Transit';
  ensureComposeGroup(state.transitGroupName, 'select');
  render();
  persistState();
});

el.egressGroupName?.addEventListener('change', () => {
  state.egressGroupName = (el.egressGroupName.value || 'Smart-Egress').trim() || 'Smart-Egress';
  ensureComposeGroup(state.egressGroupName, 'select');
  render();
  persistState();
});

el.chainGroupName?.addEventListener('change', () => {
  state.chainGroupName = (el.chainGroupName.value || 'Smart-Chain').trim() || 'Smart-Chain';
  ensureComposeGroup(state.chainGroupName, 'select');
  render();
  persistState();
});

el.createComposePreset?.addEventListener('click', () => {
  pushHistory('创建链路组');
  let idx = 1;
  let transit = `中转组-${idx}`;
  let egress = `落地组-${idx}`;
  let chain = `链式组-${idx}`;
  const names = new Set(state.groups.map((g) => g.name));
  while (names.has(transit) || names.has(egress) || names.has(chain)) {
    idx += 1;
    transit = `中转组-${idx}`;
    egress = `落地组-${idx}`;
    chain = `链式组-${idx}`;
  }
  ensureComposeGroup(transit, 'select');
  ensureComposeGroup(egress, 'select');
  ensureComposeGroup(chain, 'select');
  state.transitGroupName = transit;
  state.egressGroupName = egress;
  state.chainGroupName = chain;
  render();
  persistState();
  setPublishStatus(`已创建链路组：${transit} / ${egress} / ${chain}`, 'success');
});

el.quickGroupBtn?.addEventListener('click', quickGroupNodes);

el.autoFixBtn?.addEventListener('click', () => {
  pushHistory();
  let fixed = 0;
  let fixedNodeRefs = 0;
  let fixedGroupRefs = 0;
  let fixedRelayRefs = 0;
  let fixedRulesCount = 0;
  const validNodeIds = new Set(state.nodes.map((n) => n.id));
  const validGroupIds = new Set(state.groups.map((g) => g.id));

  state.groups.forEach((g) => {
    const nextMembers = [];
    (g.members || []).forEach((member) => {
      const key = String(member || '');
      if (key.startsWith('relay:')) {
        fixed += 1;
        fixedRelayRefs += 1;
        return;
      }
      if (key.startsWith('group:')) {
        if (!validGroupIds.has(key.slice(6))) {
          fixed += 1;
          fixedGroupRefs += 1;
          return;
        }
        nextMembers.push(member);
        return;
      }
      const nodeId = key.startsWith('node:') ? key.slice(5) : key;
      if (!validNodeIds.has(nodeId)) {
        fixed += 1;
        fixedNodeRefs += 1;
        return;
      }
      nextMembers.push(member);
    });
    g.members = nextMembers;
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
        fixedRulesCount += 1;
      }
      return segs.join(',');
    }
    return line;
  });

  el.rules.value = fixedRules.join('\n');
  state.rules = fixedRules;
  render();
  persistState();
  if (!fixed) {
    setPublishStatus('自动修复完成：没有发现需要修的内容', 'idle');
    return;
  }
  const summary = [
    fixedNodeRefs ? `失效节点 ${fixedNodeRefs} 处` : '',
    fixedGroupRefs ? `失效组 ${fixedGroupRefs} 处` : '',
    fixedRelayRefs ? `旧链式残留 ${fixedRelayRefs} 处` : '',
    fixedRulesCount ? `规则目标 ${fixedRulesCount} 处` : '',
  ].filter(Boolean).join('，');
  setPublishStatus(`自动修复完成：${summary}。共修复 ${fixed} 处`, 'success');
});

el.resetBtn?.addEventListener('click', () => {
  pushHistory();
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
el.subUrls?.addEventListener('input', persistState);
el.markdown.addEventListener('input', () => (el.markdown.dataset.manualEdit = '1'));

el.stepPrev?.addEventListener('click', () => {
  const step = getWizardStep();
  if (step === 3) return jumpTo('groups', 'canvas', 'drag');
  if (step === 2) return jumpTo('nodes', 'import', 'quick');
  return jumpTo('nodes', 'import', 'quick');
});

el.stepNext?.addEventListener('click', () => {
  const step = getWizardStep();
  if (step === 1) return jumpTo('groups', 'canvas', 'drag');
  if (step === 2) return jumpTo('publish', 'actions', 'output');
  return jumpTo('publish', 'actions', 'output');
});

el.stepNextCompose?.addEventListener('click', () => {
  jumpTo('publish', 'actions', 'output');
});

el.stepPrevPublish?.addEventListener('click', () => {
  jumpTo('groups', 'canvas', 'drag');
});

el.quickFlowBtn?.addEventListener('click', () => {
  jumpTo('nodes', 'import', 'quick');
  setPublishStatus('已回到第 1 步：导入订阅/节点', 'success');
});

el.wizStep1?.addEventListener('click', () => jumpTo('nodes', 'import', 'quick'));
el.wizStep2?.addEventListener('click', () => jumpTo('groups', 'canvas', 'drag'));
el.wizStep3?.addEventListener('click', () => jumpTo('publish', 'actions', 'output'));

el.goStep2?.addEventListener('click', () => {
  jumpTo('groups', 'canvas', 'drag');
  setPublishStatus('已进入第 2 步：把节点拖到中转组/落地组', 'success');
});

el.jumpToGroupStep?.addEventListener('click', () => {
  jumpTo('groups', 'canvas', 'drag');
  setPublishStatus('已进入第 2 步：把节点拖到中转组/落地组', 'success');
});
el.goStep3?.addEventListener('click', () => jumpTo('publish', 'actions', 'output'));
el.toggleAdvanced?.addEventListener('click', () => {
  const hidden = el.advancedOps?.classList.toggle('hidden');
  if (el.toggleAdvanced) el.toggleAdvanced.textContent = hidden ? '展开高级区' : '收起高级区';
});

async function runWebUpdate() {
  if (!el.updateStatus) return { ok: false };
  el.updateStatus.textContent = '正在更新，请稍候...';
  try {
    const resp = await fetch('/api/update', { method: 'POST' });
    const data = await resp.json();
    if (data.ok) {
      el.updateStatus.textContent = `更新完成，当前版本：v${data.local}，建议刷新页面`;
      return { ok: true, local: data.local };
    }
    el.updateStatus.textContent = `更新失败：${data.stderr || data.error || '未知错误'}`;
    return { ok: false };
  } catch {
    el.updateStatus.textContent = '网页更新不可用（请用 dev_server.py 启动服务）';
    return { ok: false };
  }
}

el.checkUpdateBtn?.addEventListener('click', checkUpdate);
el.smartUpdateBtn?.addEventListener('click', async () => {
  await checkUpdate();
  const text = el.updateStatus?.textContent || '';
  if (text.includes('已是最新版本')) return;
  await runWebUpdate();
});
el.copyUpdateCmdBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(UPDATE_CMD);
    if (el.updateStatus) el.updateStatus.textContent = '更新命令已复制，粘贴到终端执行即可';
  } catch {
    if (el.updateStatus) el.updateStatus.textContent = `复制失败，请手动执行：${UPDATE_CMD}`;
  }
});

el.smartActionBtn?.addEventListener('click', () => {
  const result = validateState();
  const hasImported = state.nodes.some((n) => n.url);
  const smart = state.groups.find((g) => g.name === 'Smart-AUTO');
  const hasGenerated = !!(smart?.members?.length);

  if (!hasImported) {
    jumpTo('nodes', 'import', 'quick');
    return setPublishStatus('先导入节点 URL，再继续', 'idle');
  }
  if (!hasGenerated) {
    jumpTo('nodes', 'generator', 'region');
    applyRegionModulesFromNodes();
    render();
    persistState();
    return setPublishStatus('已自动生成模块，继续去发布', 'success');
  }
  if (result.blockers.length) {
    jumpTo('publish', 'actions', 'output');
    renderWarnings(result);
    return setPublishStatus('发现阻塞项，先修复后发布', 'error');
  }

  el.markdown.dataset.manualEdit = '';
  el.markdown.value = buildMarkdown();
  state.mixedPort = Number(el.mixedPort.value || 7892);
  savedBaseline = getSerializableState();
  persistState();
  setPublishStatus('已完成发布链路（模拟发布）', 'success');
});

el.stepNext?.addEventListener('dblclick', () => {
  if (viewState.main === 'nodes' && viewState.sub === 'import') jumpTo('nodes', 'generator', 'region');
  else if (viewState.main === 'nodes' && viewState.sub === 'generator') jumpTo('publish', 'actions', 'output');
});

el.undoBtn?.addEventListener('click', () => {
  if (!historyState.undo.length) return setPublishStatus('没有可撤销的操作', 'idle');
  const current = getSerializableState();
  historyState.redo.push(current);
  const action = historyState.undoAction.pop() || '编辑';
  historyState.redoAction.push(action);
  const prev = historyState.undo.pop();
  applySnapshot(prev);
  setPublishStatus(`已撤销：${action}`, 'success');
});

el.redoBtn?.addEventListener('click', () => {
  if (!historyState.redo.length) return setPublishStatus('没有可重做的操作', 'idle');
  const current = getSerializableState();
  historyState.undo.push(current);
  const action = historyState.redoAction.pop() || '编辑';
  historyState.undoAction.push(action);
  const next = historyState.redo.pop();
  applySnapshot(next);
  setPublishStatus(`已重做：${action}`, 'success');
});

hydrateState();
savedBaseline = getSerializableState();
render();
renderNavigation();
renderPanes();
setPublishStatus('尚未发布', 'idle');
setImportStatus('未导入', 'idle');
if (el.updateStatus) el.updateStatus.textContent = `当前版本：v${APP_VERSION}`;

if (AUTH_DISABLED) {
  showApp();
  if (el.logoutBtn) {
    el.logoutBtn.style.display = 'none';
  }
} else if (isAuthed()) {
  showApp();
} else {
  showAuth('请先登录，首次使用会自动初始化账户');
}