#!/usr/bin/env bash
set -euo pipefail

VERSION="0.8.7"
PORT=7892
TARGET_DIR="$HOME/.smartclash-gen"
BASE_URL="https://raw.githubusercontent.com/cshaizhihao/smartclash-gen/main"
MODE="install"

usage() {
  cat <<EOF
smartclash-gen installer v${VERSION}

Usage:
  bash install.sh [-p PORT] [-d TARGET_DIR] [--update]

Options:
  -p, --port   Default mixed-port used in example command output (default: 7892)
  -d, --dir    Install directory (default: ~/.smartclash-gen)
  --update     Update existing installation in place
  -h, --help   Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -p|--port)
      [[ $# -ge 2 ]] || { echo "Missing value for $1" >&2; exit 1; }
      PORT="$2"
      shift 2
      ;;
    -d|--dir)
      [[ $# -ge 2 ]] || { echo "Missing value for $1" >&2; exit 1; }
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
      echo "Unknown arg: $1" >&2
      usage
      exit 1
      ;;
  esac
done

case "$PORT" in
  ''|*[!0-9]*)
    echo "Port must be an integer: $PORT" >&2
    exit 1
    ;;
esac
if (( PORT < 1 || PORT > 65535 )); then
  echo "Port out of range (1-65535): $PORT" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -y >/dev/null 2>&1 || true
  sudo apt-get install -y python3 python3-pip curl >/dev/null 2>&1 || true
elif command -v apk >/dev/null 2>&1; then
  sudo apk add --no-cache python3 py3-pip curl >/dev/null 2>&1 || true
fi

curl -fsSL -o generate.py "${BASE_URL}/generate.py"
curl -fsSL -o requirements.txt "${BASE_URL}/requirements.txt"
curl -fsSL -o VERSION "${BASE_URL}/VERSION" || echo "$VERSION" > VERSION
chmod +x generate.py
python3 -m pip install --user --quiet -r requirements.txt

if [[ "$MODE" == "update" ]]; then
  echo "smartclash-gen updated to: v$(cat VERSION 2>/dev/null || echo "$VERSION")"
  echo "Path: $TARGET_DIR"
else
  echo "smartclash-gen v${VERSION} installed to: $TARGET_DIR"
  echo "Suggested command:"
  echo "  python3 generate.py --urls urls.txt --rules rules.txt --port $PORT --output openclash.yaml"
  echo "You can override the port later with --port <1-65535>."
fi
