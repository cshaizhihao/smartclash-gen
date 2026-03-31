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
};

const el = {
  nodeName: document.getElementById('nodeName'),
  addNode: document.getElementById('addNode'),
  groupName: document.getElementById('groupName'),
  groupType: document.getElementById('groupType'),
  addGroup: document.getElementById('addGroup'),
  nodePool: document.getElementById('nodePool'),
  groups: document.getElementById('groups'),
  rules: document.getElementById('rules'),
  saveBtn: document.getElementById('saveBtn'),
  copyBtn: document.getElementById('copyBtn'),
  markdown: document.getElementById('markdown'),
  warnings: document.getElementById('warnings'),
};

function mkNodeLi(node) {
  const li = document.createElement('li');
  li.className = 'item';
  li.dataset.id = node.id;
  li.textContent = node.name;
  return li;
}

function syncGroupOrder() {
  const ids = [...el.groups.children].map((x) => x.dataset.id);
  state.groups.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  refreshMarkdownPreview();
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
    box.innerHTML = `
      <h4>${g.name} <small>(${g.type})</small></h4>
      <ul class="list" id="group-${g.id}"></ul>
    `;

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
    proxies: g.members
      .map((id) => state.nodes.find((n) => n.id === id)?.name)
      .filter(Boolean),
  }));

  const rules = el.rules.value
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

  if (!rules.some((r) => r.startsWith('MATCH,'))) {
    rules.push('MATCH,Smart-AUTO');
  }

  return {
    'mixed-port': 7892,
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

  state.groups.forEach((g) => {
    if (g.type === 'smart' && g.members.length === 0) {
      warnings.push(`Smart 组「${g.name}」当前为空成员`);
    }

    g.members.forEach((id) => {
      if (!state.nodes.some((n) => n.id === id)) {
        warnings.push(`策略组「${g.name}」存在无效节点引用：${id}`);
      }
    });
  });

  el.rules.value
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .forEach((line, i) => {
      if (!line.includes(',')) warnings.push(`规则第 ${i + 1} 行格式疑似无效：${line}`);
    });

  return warnings;
}

function renderWarnings(warnings) {
  if (!warnings.length) {
    el.warnings.innerHTML = '<li class="ok">✅ 状态校验通过，可安全保存</li>';
    return;
  }
  el.warnings.innerHTML = warnings.map((w) => `<li>⚠️ ${w}</li>`).join('');
}

function refreshMarkdownPreview() {
  // 仅在用户没有手动改写输出区时自动刷新
  if (!el.markdown.dataset.manualEdit) {
    el.markdown.value = buildMarkdown();
  }
  const warnings = validateState();
  renderWarnings(warnings);
}

el.addNode.addEventListener('click', () => {
  const name = el.nodeName.value.trim();
  if (!name) return;
  state.nodes.push({ id: crypto.randomUUID(), name });
  el.nodeName.value = '';
  render();
});

el.addGroup.addEventListener('click', () => {
  const name = el.groupName.value.trim();
  if (!name) return;
  state.groups.push({
    id: crypto.randomUUID(),
    name,
    type: el.groupType.value,
    members: [],
  });
  el.groupName.value = '';
  render();
});

el.saveBtn.addEventListener('click', () => {
  const warnings = validateState();
  renderWarnings(warnings);
  el.markdown.dataset.manualEdit = '';
  el.markdown.value = buildMarkdown();
});

el.copyBtn.addEventListener('click', async () => {
  const text = el.markdown.value;
  await navigator.clipboard.writeText(text);
  el.copyBtn.textContent = '已复制 ✅';
  setTimeout(() => (el.copyBtn.textContent = '复制 Markdown'), 1200);
});

el.rules.addEventListener('input', () => {
  state.rules = el.rules.value.split('\n');
  refreshMarkdownPreview();
});

el.markdown.addEventListener('input', () => {
  el.markdown.dataset.manualEdit = '1';
});

render();