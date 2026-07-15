#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/opt/zlinfot-ai"
BACKEND_DIR=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --app-root) APP_ROOT="$2"; shift 2 ;;
        *) echo "Unknown option: $1" >&2; exit 1 ;;
    esac
done

BACKEND_DIR="$APP_ROOT/backend"
SERVICE_NAME="zlai-backend.service"

current_target="$(readlink -f "$BACKEND_DIR/current" 2>/dev/null || true)"
previous_target="$(readlink -f "$BACKEND_DIR/previous" 2>/dev/null || true)"

if [[ -z "$current_target" || ! -d "$previous_target" ]]; then
    echo "Cannot rollback backend: missing current/previous" >&2
    exit 1
fi

ln -sfn "$previous_target" "$BACKEND_DIR/current"
ln -sfn "$current_target" "$BACKEND_DIR/previous"
cp "$BACKEND_DIR/current/.env" "$BACKEND_DIR/.env" 2>/dev/null || true

systemctl restart "$SERVICE_NAME"

for i in {1..10}; do
    if curl -fsS http://127.0.0.1:8000/api/health >/dev/null; then
        echo "Backend rollback health check OK"
        exit 0
    fi
    sleep 1
done

echo "Backend rollback health check failed" >&2
exit 1
