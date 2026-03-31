# smartclash-gen

一个面向 **OpenClash + mihomo(type: smart)** 的配置生成器：

- 输入常用订阅 URL（`vless://`、`vmess://`、`trojan://`、`ss://`），一行一条
- 自动生成可编辑的 `.yaml`
- 自动输出 Markdown 版 YAML（代码块）
- 输入 `rul`/`rules`（一行一条）后，自动转为 YAML 规则并注入 Smart 策略组
- 内置 Smart 策略组（含正则优先级）用于自动分类与智能选路

---

## 一键安装（支持自定义端口）

> 默认端口 7890，可通过 `-p` 自定义。

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main/install.sh)" -- -p 10801
```

---

## 输入文件格式

### 1) URLs 文件（`urls.txt`）

一行一个节点 URL，例如：

```text
vless://uuid@host:443?type=ws&security=tls&sni=example.com&path=%2Fws#HK-01
vmess://xxxxx(base64)
trojan://password@host:443?sni=example.com#SG-01
ss://xxxxx#JP-01
```

### 2) Rules 文件（`rules.txt` 或 `rul.txt`）

一行一个规则，例如：

```text
DOMAIN-SUFFIX,google.com,Smart-AUTO
DOMAIN-KEYWORD,openai,Smart-SG
IP-CIDR,8.8.8.8/32,Smart-JP,no-resolve
MATCH,Smart-AUTO
```

> 若规则只写两段（如 `DOMAIN-SUFFIX,google.com`），默认策略组会补成 `Smart-AUTO`。

---

## 生成命令

```bash
python3 generate.py --urls urls.txt --rules rules.txt --port 10801 --output openclash.yaml
```

生成结果：

- `openclash.yaml`（可直接编辑、用于 OpenClash）
- `openclash.md`（Markdown 包裹的 YAML）

---

## 生成内容说明

会自动生成：

- `proxies`
- `proxy-groups`
  - `Smart-AUTO`（`type: smart`）
  - `Smart-HK` / `Smart-SG` / `Smart-JP`
  - 默认带 `policy-priority` 正则优先级
- `rules`
  - 来自你的 `rules.txt`
  - 自动补一条兜底：`MATCH,Smart-AUTO`

---

## 适配说明

- Smart 策略组依赖 **mihomo 内核**（OpenClash 的 mihomo 分支）
- 如需 LightGBM：
  - `uselightgbm: true`
  - 模型文件：`/etc/openclash/Model.bin`

---

## 免责声明

本项目仅用于网络配置自动化与学习交流，请在遵守当地法律法规和服务条款前提下使用。
