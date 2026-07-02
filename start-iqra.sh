#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$ROOT_DIR/iqra-app"
PORT="${PORT:-3001}"

usage() {
  cat <<'EOF'
Usage: ./start-iqra.sh [--tunnel] [--dev] [--stop] [--help]

Options:
  --tunnel   Start cloudflared tunnel to http://localhost:3001
  --dev      Run Next.js in dev mode on 3001 (default is stable prod mode)
  --stop     Stop local Next.js and cloudflared processes and exit
  --help     Show this help message

Examples:
  ./start-iqra.sh
  ./start-iqra.sh --tunnel
  ./start-iqra.sh --dev --tunnel
  PORT=3001 ./start-iqra.sh
EOF
}

WITH_TUNNEL=0
RUN_MODE="stable"
STOP_ONLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tunnel)
      WITH_TUNNEL=1
      shift
      ;;
    --dev)
      RUN_MODE="dev"
      shift
      ;;
    --stop)
      STOP_ONLY=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -d "$APP_DIR" ]]; then
  echo "Missing app directory: $APP_DIR" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not found in PATH." >&2
  exit 1
fi

stop_processes() {
  pkill -f "next dev|next start|next-server" >/dev/null 2>&1 || true
  pkill -f "cloudflared tunnel --url" >/dev/null 2>&1 || true
}

stop_processes

if [[ "$STOP_ONLY" == "1" ]]; then
  echo "Stopped Next.js and cloudflared processes."
  exit 0
fi

if command -v /Library/PostgreSQL/18/bin/pg_isready >/dev/null 2>&1; then
  /Library/PostgreSQL/18/bin/pg_isready -h localhost -p 5432 >/dev/null 2>&1 || {
    echo "Warning: PostgreSQL is not responding on localhost:5432" >&2
  }
fi

if [[ "$WITH_TUNNEL" == "1" ]]; then
  if ! command -v cloudflared >/dev/null 2>&1; then
    echo "cloudflared is not installed. Install it or run without --tunnel." >&2
    exit 1
  fi

  echo "Starting cloudflared tunnel -> http://localhost:$PORT"
  cloudflared tunnel --url "http://localhost:$PORT" >/tmp/iqra-cloudflared.log 2>&1 &
  TUNNEL_PID=$!
  echo "cloudflared PID: $TUNNEL_PID (log: /tmp/iqra-cloudflared.log)"

  cleanup() {
    if ps -p "$TUNNEL_PID" >/dev/null 2>&1; then
      kill "$TUNNEL_PID" >/dev/null 2>&1 || true
    fi
  }
  trap cleanup EXIT INT TERM
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://iqra:iqra_dev_password@localhost:5432/iqra}"
export AUTH_SECRET="${AUTH_SECRET:-local-test-auth-secret-please-replace}"
export AUTH_URL="${AUTH_URL:-http://localhost:$PORT}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:$PORT}"
export KNOWLEDGE_STORAGE_DIR="${KNOWLEDGE_STORAGE_DIR:-storage/knowledge}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:$PORT}"

if [[ "$RUN_MODE" == "dev" ]]; then
  echo "Starting IQRA in dev mode on port $PORT"
  exec npm --prefix "$APP_DIR" run dev -- -p "$PORT"
fi

echo "Starting IQRA in stable mode on port $PORT"
npm --prefix "$APP_DIR" run build:webpack
exec npm --prefix "$APP_DIR" run start -- -p "$PORT"
