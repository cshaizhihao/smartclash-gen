#!/usr/bin/env bash
set -e

PORT=7890
TARGET_DIR="$HOME/.smartclash-gen"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--port)
      PORT="$2"; shift 2 ;;
    -d|--dir)
      TARGET_DIR="$2"; shift 2 ;;
    *)
      echo "Unknown arg: $1"; exit 1 ;;
  esac
done

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -y >/dev/null 2>&1 || true
  sudo apt-get install -y python3 python3-pip >/dev/null 2>&1 || true
elif command -v apk >/dev/null 2>&1; then
  sudo apk add --no-cache python3 py3-pip >/dev/null 2>&1 || true
fi

if [ ! -f generate.py ]; then
  curl -fsSL -o generate.py https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main/generate.py
fi

python3 -m pip install --user --quiet -r <(curl -fsSL https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main/requirements.txt)
chmod +x generate.py

echo "✅ 安装完成 smartclash-gen v0.2.0"
echo "默认端口: $PORT"
echo "用法示例:"
echo "  python3 generate.py --urls urls.txt --rules rules.txt --port $PORT --output openclash.yaml"
