#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/opt/zlinfot-ai"
BACKEND_DIR="$APP_ROOT/backend"
RELEASE_DIR=""
SKIP_SYSTEMD=""

usage() {
    cat <<EOF
Usage: $0 --release-id <ID> [--app-root PATH] [--skip-systemd]
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --release-id) RELEASE_DIR="$APP_ROOT/releases/$2"; shift 2 ;;
        --app-root) APP_ROOT="$2"; BACKEND_DIR="$APP_ROOT/backend"; shift 2 ;;
        --skip-systemd) SKIP_SYSTEMD=1; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
    esac
done

[[ -n "${RELEASE_DIR:-}" ]] || { echo "Missing --release-id" >&2; exit 1; }

SERVICE_NAME="zlai-backend.service"
SERVICE_FILE="$RELEASE_DIR/server/systemd/$SERVICE_NAME"
ENV_RUNNER="$RELEASE_DIR/server/run-with-environment-file.py"

if [[ -z "$SKIP_SYSTEMD" && ! -f "$SERVICE_FILE" ]]; then
    echo "Missing systemd service file: $SERVICE_FILE" >&2
    exit 1
fi
[[ -f "$ENV_RUNNER" ]] || { echo "Missing environment runner: $ENV_RUNNER" >&2; exit 1; }

# Ensure directory layout
mkdir -p "$BACKEND_DIR/releases"
mkdir -p "$BACKEND_DIR/logs"
mkdir -p "$BACKEND_DIR/systemd"

BACKEND_RELEASE_DIR="$BACKEND_DIR/releases/$(basename "$RELEASE_DIR")"
previous_current="$(readlink -f "$BACKEND_DIR/current" 2>/dev/null || true)"

# Refuse to prepare or switch a release without operator-provisioned secrets.
ENV_FILE="$BACKEND_DIR/.env"
[[ -f "$ENV_FILE" ]] || {
    echo "Missing production environment file: $ENV_FILE" >&2
    echo "Provision DATABASE_URL, ENVIRONMENT=production, ADMIN_USERNAME and ADMIN_PASSWORD before deploying." >&2
    exit 1
}

# Copy backend code into the release-specific backend directory
rm -rf "$BACKEND_RELEASE_DIR"
cp -a "$RELEASE_DIR/backend" "$BACKEND_RELEASE_DIR"

# Create Python virtual environment if not present
VENV_DIR="$BACKEND_DIR/venv"
if [[ ! -d "$VENV_DIR" ]]; then
    python3.11 -m venv "$VENV_DIR"
fi
"$VENV_DIR/bin/pip" install -q -r "$BACKEND_RELEASE_DIR/requirements.txt"

cp "$ENV_FILE" "$BACKEND_RELEASE_DIR/.env"

# Run migrations (fail if DB unreachable)
(
    cd "$BACKEND_RELEASE_DIR"
    "$VENV_DIR/bin/python" "$ENV_RUNNER" "$ENV_FILE" "$VENV_DIR/bin/alembic" upgrade head
)

# Preserve the old release for rollback, then atomically switch current.
if [[ -n "$previous_current" && -d "$previous_current" ]]; then
    ln -sfn "$previous_current" "$BACKEND_DIR/previous"
fi
ln -sfn "$BACKEND_RELEASE_DIR" "$BACKEND_DIR/current"
ln -sfn "$BACKEND_DIR/current" "$RELEASE_DIR/backend"

# Install / update systemd service
if [[ -z "$SKIP_SYSTEMD" ]]; then
    cp "$SERVICE_FILE" "/etc/systemd/system/$SERVICE_NAME"
    systemctl daemon-reload
    systemctl enable "$SERVICE_NAME"
    systemctl restart "$SERVICE_NAME"
fi

# Health check
for i in {1..10}; do
    if curl -fsS http://127.0.0.1:8000/api/health >/dev/null; then
        echo "Backend health check OK"
        exit 0
    fi
    sleep 1
done

echo "Backend health check failed" >&2
if [[ -n "$previous_current" && -d "$previous_current" ]]; then
    ln -sfn "$previous_current" "$BACKEND_DIR/current"
    if [[ -z "$SKIP_SYSTEMD" ]]; then
        systemctl restart "$SERVICE_NAME"
    fi
    echo "Restored previous backend release after failed health check" >&2
fi
exit 1
