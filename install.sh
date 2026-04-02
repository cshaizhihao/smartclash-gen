#!/usr/bin/env bash
set -euo pipefail

VERSION="1.0.0"
PORT=7892
WEB_PORT=10100
TARGET_DIR="$HOME/.smartclash-gen"
BASE_URL="https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main"
FALLBACK_BASE_URL="https://cdn.jsdelivr.net/gh/cshaizhihao/smartclash-gen@main"
MODE="install"
PORT_EXPLICIT=0
WEB_PORT_EXPLICIT=0

usage() {
  cat <<EOF
Clash Smart 分组编辑器 安装脚本 v${VERSION}

用法：
  bash install.sh [-p 端口] [-w 网页端口] [-d 安装目录] [--update]

参数：
  -p, --port       指定默认 mixed-port（默认：7892）
  -w, --web-port   指定 Web 编排台访问端口（默认：10100）
  -d, --dir        指定安装目录（默认：~/.smartclash-gen）
  --update         在现有目录中执行更新
  -h, --help       显示帮助信息
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--port)
      [[ $# -ge 2 ]] || { echo "参数 $1 缺少端口值" >&2; exit 1; }
      PORT="$2"
      PORT_EXPLICIT=1
      shift 2
      ;;
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
    --update)
      MODE="update"
      shift
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

if [[ "$MODE" == "install" && -t 0 ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Clash Smart 分组编辑器 安装向导"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if [[ "$PORT_EXPLICIT" -eq 0 ]]; then
    echo "配置代理端口（mixed-port）默认是 7892。"
    read -r -p "请输入 mixed-port（直接回车使用 7892）：" INPUT_PORT
    if [[ -n "${INPUT_PORT:-}" ]]; then
      PORT="$INPUT_PORT"
    fi
  fi
  if [[ "$WEB_PORT_EXPLICIT" -eq 0 ]]; then
    echo "网页编排台访问端口默认是 10100。"
    read -r -p "请输入 Web 访问端口（直接回车使用 10100）：" INPUT_WEB_PORT
    if [[ -n "${INPUT_WEB_PORT:-}" ]]; then
      WEB_PORT="$INPUT_WEB_PORT"
    fi
  fi
fi

case "$PORT" in
  ''|*[!0-9]*)
    echo "端口必须是整数：$PORT" >&2
    exit 1
    ;;
esac
if (( PORT < 1 || PORT > 65535 )); then
  echo "端口超出范围（1-65535）：$PORT" >&2
  exit 1
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
  if curl --retry 3 --retry-delay 2 --retry-all-errors -fsSL -o "$dest" "$fallback_url"; then
    return 0
  fi

  echo "下载失败：$rel" >&2
  echo "可能原因：GitHub Raw / CDN 限流或网络异常。" >&2
  return 1
}

auto_open_firewall() {
  local port="$1"

  if command -v ufw >/dev/null 2>&1; then
    local ufw_state
    ufw_state="$(sudo ufw status 2>/dev/null | head -n 1 || true)"
    if echo "$ufw_state" | grep -qi "Status: active"; then
      sudo ufw allow "${port}/tcp" >/dev/null 2>&1 || true
      echo "已尝试通过 UFW 放行端口：${port}/tcp"
      return 0
    fi
  fi

  if command -v firewall-cmd >/dev/null 2>&1; then
    if sudo firewall-cmd --state >/dev/null 2>&1; then
      sudo firewall-cmd --permanent --add-port="${port}/tcp" >/dev/null 2>&1 || true
      sudo firewall-cmd --reload >/dev/null 2>&1 || true
      echo "已尝试通过 firewalld 放行端口：${port}/tcp"
      return 0
    fi
  fi

  return 0
}

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -y >/dev/null 2>&1 || true
  sudo apt-get install -y python3 python3-pip python3-venv python3-full curl >/dev/null 2>&1 || true
elif command -v apk >/dev/null 2>&1; then
  sudo apk add --no-cache python3 py3-pip curl >/dev/null 2>&1 || true
fi

download_file generate.py generate.py
download_file requirements.txt requirements.txt
if ! download_file VERSION VERSION; then
  echo "$VERSION" > VERSION
fi

mkdir -p web
download_file web/index.html web/index.html
download_file web/style.css web/style.css
download_file web/app.js web/app.js
download_file web/dev_server.py web/dev_server.py
cat > start-web.sh <<EOF
#!/usr/bin/env bash
set -e
cd "${TARGET_DIR}/web"
exec env PORT=${WEB_PORT} ../.venv/bin/python dev_server.py
EOF
cat > start-web-bg.sh <<EOF
#!/usr/bin/env bash
set -e
cd "${TARGET_DIR}/web"
mkdir -p ../runtime
if [[ -f ../runtime/web.pid ]]; then
  old_pid="$(cat ../runtime/web.pid 2>/dev/null || true)"
  if [[ -n "${old_pid:-}" ]] && kill -0 "$old_pid" >/dev/null 2>&1; then
    kill "$old_pid" >/dev/null 2>&1 || true
    sleep 1
  fi
fi
nohup env PORT=${WEB_PORT} ../.venv/bin/python dev_server.py > ../runtime/web.log 2>&1 < /dev/null &
echo $! > ../runtime/web.pid
echo "已在后台启动 Web 编排台，PID: $(cat ../runtime/web.pid)"
EOF
chmod +x generate.py web/dev_server.py start-web.sh start-web-bg.sh

if [[ -d .venv ]]; then
  rm -rf .venv
fi
if ! python3 -m venv .venv >/dev/null 2>&1; then
  echo "创建虚拟环境失败，请先安装 python3-venv / python3-full 后重试。" >&2
  exit 1
fi
if ! .venv/bin/python -m ensurepip --upgrade >/dev/null 2>&1; then
  echo "虚拟环境 pip 初始化失败，请确认系统已安装 python3-venv / python3-full。" >&2
  exit 1
fi
.venv/bin/python -m pip install --upgrade pip setuptools wheel >/dev/null 2>&1 || true
.venv/bin/python -m pip install --quiet -r requirements.txt

PUBLIC_HOST=$(hostname -I 2>/dev/null | awk '{print $1}')
[[ -n "${PUBLIC_HOST:-}" ]] || PUBLIC_HOST="127.0.0.1"

if [[ "$MODE" == "update" ]]; then
  echo "Clash Smart 分组编辑器 已更新到：v$(cat VERSION 2>/dev/null || echo "$VERSION")"
  echo "安装目录：$TARGET_DIR"
  ( cd "$TARGET_DIR" && ./start-web-bg.sh )
  auto_open_firewall "$WEB_PORT"
else
  echo "Clash Smart 分组编辑器 v$(cat VERSION 2>/dev/null || echo "$VERSION") 已安装完成"
  echo "安装目录：$TARGET_DIR"
  echo "配置代理端口（mixed-port）：$PORT"
  echo "网页访问端口（Web Port）：$WEB_PORT"
  echo ""
  echo "命令行生成示例："
  echo "  cd $TARGET_DIR && .venv/bin/python generate.py --urls urls.txt --rules rules.txt --port $PORT --output openclash.yaml"
  echo ""
  echo "正在自动后台启动 Web 编排台..."
  ( cd "$TARGET_DIR" && ./start-web-bg.sh )
  auto_open_firewall "$WEB_PORT"
  echo ""
  echo "浏览器访问地址："
  echo "  http://127.0.0.1:$WEB_PORT"
  echo "  http://${PUBLIC_HOST}:$WEB_PORT"
  echo ""
  echo "后续如果想改端口，可重新执行脚本并使用："
  echo "  --port <1-65535>      # 修改配置代理端口"
  echo "  --web-port <1-65535> # 修改网页访问端口"
  echo ""
  echo "依赖已安装在：$TARGET_DIR/.venv"
  echo "日志文件：$TARGET_DIR/runtime/web.log"
  echo ""
  echo "如果浏览器仍然无法从外网打开，请继续检查云服务器安全组 / 云防火墙是否已放行 ${WEB_PORT}/tcp。"
  echo ""
  echo "如果你的系统仍然拦截 pip，可手动执行："
  echo "  sudo apt-get install -y python3-full python3-venv"
  echo "  cd $TARGET_DIR && rm -rf .venv && python3 -m venv .venv"
  echo "  .venv/bin/python -m pip install -r requirements.txt"
fi

sleep 2
if curl -fsS "http://127.0.0.1:${WEB_PORT}" >/dev/null 2>&1; then
  echo ""
  echo "Web 编排台启动成功。"
else
  echo ""
  echo "Web 编排台启动失败，请查看日志：$TARGET_DIR/runtime/web.log" >&2
fi
