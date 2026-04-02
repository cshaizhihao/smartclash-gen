#!/usr/bin/env bash
set -euo pipefail

VERSION="1.0.0"
PORT=7892
TARGET_DIR="$HOME/.smartclash-gen"
BASE_URL="https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main"
MODE="install"
PORT_EXPLICIT=0

usage() {
  cat <<EOF
Clash Smart 分组编辑器 安装脚本 v${VERSION}

用法：
  bash install.sh [-p 端口] [-d 安装目录] [--update]

参数：
  -p, --port   指定默认 mixed-port（默认：7892）
  -d, --dir    指定安装目录（默认：~/.smartclash-gen）
  --update     在现有目录中执行更新
  -h, --help   显示帮助信息
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

if [[ "$MODE" == "install" && "$PORT_EXPLICIT" -eq 0 && -t 0 ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Clash Smart 分组编辑器 安装向导"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "默认 mixed-port 为 7892。"
  read -r -p "请输入要使用的 mixed-port（直接回车使用 7892）：" INPUT_PORT
  if [[ -n "${INPUT_PORT:-}" ]]; then
    PORT="$INPUT_PORT"
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

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -y >/dev/null 2>&1 || true
  sudo apt-get install -y python3 python3-pip python3-venv python3-full curl >/dev/null 2>&1 || true
elif command -v apk >/dev/null 2>&1; then
  sudo apk add --no-cache python3 py3-pip curl >/dev/null 2>&1 || true
fi

curl -fsSL -o generate.py "${BASE_URL}/generate.py"
curl -fsSL -o requirements.txt "${BASE_URL}/requirements.txt"
curl -fsSL -o VERSION "${BASE_URL}/VERSION" || echo "$VERSION" > VERSION

mkdir -p web
curl -fsSL -o web/index.html "${BASE_URL}/web/index.html"
curl -fsSL -o web/style.css "${BASE_URL}/web/style.css"
curl -fsSL -o web/app.js "${BASE_URL}/web/app.js"
curl -fsSL -o web/dev_server.py "${BASE_URL}/web/dev_server.py"
chmod +x generate.py web/dev_server.py

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

if [[ "$MODE" == "update" ]]; then
  echo "Clash Smart 分组编辑器 已更新到：v$(cat VERSION 2>/dev/null || echo "$VERSION")"
  echo "安装目录：$TARGET_DIR"
else
  echo "Clash Smart 分组编辑器 v$(cat VERSION 2>/dev/null || echo "$VERSION") 已安装完成"
  echo "安装目录：$TARGET_DIR"
  echo "默认 mixed-port：$PORT"
  echo ""
  echo "命令行生成示例："
  echo "  cd $TARGET_DIR && .venv/bin/python generate.py --urls urls.txt --rules rules.txt --port $PORT --output openclash.yaml"
  echo ""
  echo "启动 Web 编排台："
  echo "  cd $TARGET_DIR/web && ../.venv/bin/python dev_server.py"
  echo ""
  echo "后续如果想改端口，可重新执行脚本并使用：--port <1-65535>"
  echo "依赖已安装在：$TARGET_DIR/.venv"
  echo ""
  echo "如果你的系统仍然拦截 pip，可手动执行："
  echo "  sudo apt-get install -y python3-full python3-venv"
  echo "  cd $TARGET_DIR && rm -rf .venv && python3 -m venv .venv"
  echo "  .venv/bin/python -m pip install -r requirements.txt"
fi
