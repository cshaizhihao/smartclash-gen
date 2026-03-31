const STORAGE_KEY = 'smartclash-web-v070';
const AUTH_KEY = 'smartclash-web-auth';
const AUTH_SESSION_KEY = 'smartclash-web-auth-session';

const state = {
  nodes: [
    { id: crypto.randomUUID(), name: 'HK-01' },
    { id: crypto.randomUUID(), name: 'SG-01' },
    { id: crypto.randomUUID(), name: 'JP-01' },
  ],
  groups: [
    { id: crypto.randomUUID(), name: 'Smart-AUTO', type: 'smart', members: [] },
    { id: crypto.randomUUID(), name: 'Smart-HK', type: 'select', members: [] },
  ],
  rules: ['DOMAIN-SUFFIX,google.com,Smart-AUTO', 'MATCH,Smart-AUTO'],
  mixedPort: 7892,
};

const el = {
  authGate: document.getElementById('authGate'),
  authUser: document.getElementById('authUser'),
  authPass: document.getElementById('authPass'),
  authRemember: document.getElementById('authRemember'),
  authBtn: document.getElementById('authBtn'),
  authTips: document.getElementById('authTips'),
  appShell: document.getElementById('appShell'),
  logoutBtn: document.getElementById('logoutBtn'),

  nodeName: document.getElementById('nodeName'),
  addNode: document.getElementById('addNode'),
  nodeUrls: document.getElementById('nodeUrls'),
  importUrlsBtn: document.getElementById('importUrlsBtn'),
  importStatus: document.getElementById('importStatus'),

  groupName: document.getElementById('groupName'),
  groupType: document.getElementById('groupType'),
  addGroup: document.getElementById('addGroup'),
  nodePool: document.getElementById('nodePool'),
  groups: document.getElementById('groups'),

  rules: document.getElementById('rules'),
  mixedPort: document.getElementById('mixedPort'),
  saveBtn: document.getElementById('saveBtn'),
  copyBtn: document.getElementById('copyBtn'),
  downloadBtn: document.getElementById('downloadBtn'),
  downloadYamlBtn: document.getElementById('downloadYamlBtn'),
  publishBtn: document.getElementById('publishBtn'),
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

function mkNodeLi(node) {
  const li = document.createElement('li');
  li.className = 'item';
  li.dataset.id = node.id;
  li.textContent = node.name;
  return li;
}

function setImportStatus(text, type = 'idle') {
  el.importStatus.textContent = text;
  el.importStatus.dataset.type = type;
}

function parseNodeUrl(line, index) {
  const raw = line.trim();
  if (!raw) return null;
  const m = raw.match(/^(vless|vmess|trojan|ss):\/\//i);
  if (!m) return { ok: false, error: `第 ${index + 1} 行协议不支持` };
  const nameMatch = raw.match(/#(.+)$/);
  const name = nameMatch ? decodeURIComponent(nameMatch[1]).trim() : `${m[1].toUpperCase()}-${index + 1}`;
  if (!name) return { ok: false, error: `第 ${index + 1} 行节点名为空` };
  return { ok: true, name };
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

function hydrateState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.nodes)) state.nodes = parsed.nodes;
    if (Array.isArray(parsed.groups)) state.groups = parsed.groups;
    if (Array.isArray(parsed.rules)) state.rules = parsed.rules;
    if (parsed.mixedPort) state.mixedPort = Number(parsed.mixedPort);
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
  refreshMarkdownPreview();
}

function buildYamlObject() {
  const proxies = state.nodes.map((n) => ({
    name: n.name,
    type: 'ss',
    server: '1.1.1.1',
    port: 443,
    cipher: 'aes-128-gcm',
    password: 'change-me',
  }));

  const proxyGroups = state.groups.map((g) => ({
    name: g.name,
    type: g.type,
    proxies: g.members.map((id) => state.nodes.find((n) => n.id === id)?.name).filter(Boolean),
  }));

  const rules = el.rules.value.split('\n').map((x) => x.trim()).filter(Boolean);
  if (!rules.some((r) => r.startsWith('MATCH,'))) rules.push('MATCH,Smart-AUTO');

  return {
    'mixed-port': Number(el.mixedPort.value || state.mixedPort || 7892),
    'allow-lan': true,
    mode: 'rule',
    proxies,
    'proxy-groups': proxyGroups,
    rules,
  };
}

function buildMarkdown() {
  const yaml = jsyaml.dump(buildYamlObject(), { noRefs: true });
  return `# smartclash-gen 可编辑配置\n\n\`\`\`yaml\n${yaml}\`\`\`\n`;
}

function validateState() {
  const warnings = [];
  const blockers = [];
  const knownNodeIds = new Set(state.nodes.map((n) => n.id));
  const knownGroupNames = new Set(state.groups.map((g) => g.name));

  state.groups.forEach((g) => {
    if (g.type === 'smart' && g.members.length === 0) {
      warnings.push(`Smart 组「${g.name}」当前为空成员`);
      blockers.push(`Smart 组「${g.name}」为空，禁止发布`);
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
      return;
    }
    if (segs.length >= 3) {
      const target = segs[2];
      if (target !== 'DIRECT' && !knownGroupNames.has(target)) blockers.push(`规则第 ${i + 1} 行引用不存在策略组，禁止发布`);
    }
  });

  const p = Number(el.mixedPort.value || 0);
  if (!Number.isInteger(p) || p < 1 || p > 65535) blockers.push('mixed-port 必须是 1-65535 之间的整数，禁止发布');

  return { warnings, blockers };
}

function renderWarnings(result) {
  const items = [];
  result.blockers.forEach((x) => items.push(`<li>⛔ ${x}</li>`));
  result.warnings.forEach((x) => items.push(`<li>⚠️ ${x}</li>`));
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
  state.nodes.push({ id: crypto.randomUUID(), name });
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
    state.nodes.push({ id: crypto.randomUUID(), name: parsed.name });
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
  state.groups.push({ id: crypto.randomUUID(), name, type: el.groupType.value, members: [] });
  el.groupName.value = '';
  render();
  persistState();
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
    return setPublishStatus(`发布失败：${summary}${result.blockers.length > 2 ? '…' : ''}`, 'error');
  }
  persistState();
  setPublishStatus('发布成功：配置已通过校验（模拟发布）', 'success');
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

el.nodeUrls.addEventListener('input', persistState);
el.markdown.addEventListener('input', () => (el.markdown.dataset.manualEdit = '1'));

hydrateState();
render();
setPublishStatus('尚未发布', 'idle');
setImportStatus('未导入', 'idle');

if (isAuthed()) showApp();
else showAuth('请先登录，首次使用会自动初始化账户');