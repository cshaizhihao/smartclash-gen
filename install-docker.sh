#!/usr/bin/env bash
set -euo pipefail

VERSION="1.0.0"
TARGET_DIR="$HOME/.smartclash-gen"
BASE_URL="https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main"
FALLBACK_BASE_URL="https://cdn.jsdelivr.net/gh/cshaizhihao/smartclash-gen@main"
WEB_PORT=10100
WEB_PORT_EXPLICIT=0

usage() {
  cat <<EOF
Clash Smart 分组编辑器 Docker 安装脚本 v${VERSION}

用法：
  bash install-docker.sh [-w 网页端口] [-d 安装目录]

参数：
  -w, --web-port   指定 Web 编排台访问端口（默认：10100）
  -d, --dir        指定安装目录（默认：~/.smartclash-gen）
  -h, --help       显示帮助信息
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -w|--web-port)
      [[ $# -ge 2 ]] || { echo "参数 $1 缺少网页端口值" >&2; exit 1; }
      WEB_PORT="$2"
      WEB_PORT_EXPLICIT=1
      shift 2
      ;;
    -d|--dir)
      [[ $# -ge 2 ]] || { echo "参数 $1 缺少目录值" >&2; exit 1; }
      TARGET_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "未知参数：$1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -t 0 && "$WEB_PORT_EXPLICIT" -eq 0 ]]; then
  echo "网页编排台访问端口默认是 10100。"
  read -r -p "请输入 Web 访问端口（直接回车使用 10100）：" INPUT_WEB_PORT
  if [[ -n "${INPUT_WEB_PORT:-}" ]]; then
    WEB_PORT="$INPUT_WEB_PORT"
  fi
fi

case "$WEB_PORT" in
  ''|*[!0-9]*)
    echo "网页访问端口必须是整数：$WEB_PORT" >&2
    exit 1
    ;;
esac
if (( WEB_PORT < 1 || WEB_PORT > 65535 )); then
  echo "网页访问端口超出范围（1-65535）：$WEB_PORT" >&2
  exit 1
fi

download_file() {
  local rel="$1"
  local dest="$2"
  local primary_url="${BASE_URL}/${rel}"
  local fallback_url="${FALLBACK_BASE_URL}/${rel}"

  if curl --retry 3 --retry-delay 2 --retry-all-errors -fsSL -o "$dest" "$primary_url"; then
    return 0
  fi
  echo "主下载源失败，尝试备用镜像：$rel"
  curl --retry 3 --retry-delay 2 --retry-all-errors -fsSL -o "$dest" "$fallback_url"
}

auto_open_firewall() {
  local port="$1"
  if command -v ufw >/dev/null 2>&1; then
    local ufw_state
    ufw_state="$(sudo ufw status 2>/dev/null | head -n 1 || true)"
    if echo "$ufw_state" | grep -qi "Status: active"; then
      sudo ufw allow "${port}/tcp" >/dev/null 2>&1 || true
    fi
  fi
  if command -v firewall-cmd >/dev/null 2>&1; then
    if sudo firewall-cmd --state >/dev/null 2>&1; then
      sudo firewall-cmd --permanent --add-port="${port}/tcp" >/dev/null 2>&1 || true
      sudo firewall-cmd --reload >/dev/null 2>&1 || true
    fi
  fi
}

if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 Docker，请先安装 Docker 后再运行本脚本。" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"
mkdir -p web/published

download_file Dockerfile Dockerfile
download_file requirements.txt requirements.txt
download_file generate.py generate.py
download_file VERSION VERSION
download_file web/index.html web/index.html
download_file web/style.css web/style.css
download_file web/app.js web/app.js
download_file web/dev_server.py web/dev_server.py

cat > docker-compose.yml <<EOF
services:
  clash-smart:
    build: .
    container_name: clash-smart-editor
    restart: unless-stopped
    ports:
      - "${WEB_PORT}:10100"
    environment:
      HOST: 0.0.0.0
      PORT: 10100
    volumes:
      - ./web/published:/app/web/published
EOF

if docker compose version >/dev/null 2>&1; then
  docker compose up -d --build
else
  docker-compose up -d --build
fi

auto_open_firewall "$WEB_PORT"
PUBLIC_HOST=$(hostname -I 2>/dev/null | awk '{print $1}')
[[ -n "${PUBLIC_HOST:-}" ]] || PUBLIC_HOST="127.0.0.1"

echo "Clash Smart 分组编辑器 Docker 版已部署完成"
echo "安装目录：$TARGET_DIR"
echo "访问地址："
echo "  http://127.0.0.1:${WEB_PORT}"
echo "  http://${PUBLIC_HOST}:${WEB_PORT}"
echo ""
echo "如需停止："
echo "  cd $TARGET_DIR && docker compose down"
