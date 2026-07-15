#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

command -v npm >/dev/null 2>&1 || { echo "错误：未找到 npm。" >&2; exit 1; }
command -v tar >/dev/null 2>&1 || { echo "错误：未找到 tar。" >&2; exit 1; }

# Frontend build
npm run build --prefix frontend

INCLUDE_BACKEND="${INCLUDE_BACKEND:-0}"
if [[ "$INCLUDE_BACKEND" == "1" ]]; then
  BACKEND_PYTHON="${BACKEND_PYTHON:-}"
  if [[ -z "$BACKEND_PYTHON" ]]; then
    if [[ -x backend/.venv/bin/python ]]; then
      BACKEND_PYTHON="$ROOT/backend/.venv/bin/python"
    else
      BACKEND_PYTHON="$(command -v python3)"
    fi
  elif [[ "$BACKEND_PYTHON" != /* ]]; then
    BACKEND_PYTHON="$ROOT/$BACKEND_PYTHON"
  fi
  [[ -x "$BACKEND_PYTHON" ]] || { echo "错误：BACKEND_PYTHON 不可执行。" >&2; exit 1; }
  ( cd backend && "$BACKEND_PYTHON" -c "import app.main" )
fi

cd "$ROOT"

OUT_DIR="dist"
[[ -f "$OUT_DIR/index.html" ]] || { echo "错误：构建结果缺少 $OUT_DIR/index.html。" >&2; exit 1; }

BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
GIT_SHA="$(git rev-parse HEAD 2>/dev/null || printf 'unknown')"
RELEASE_NAME="process-industry-ai-$STAMP"
ARCHIVE="$RELEASE_NAME.tar.gz"
STAGING="$(mktemp -d "${TMPDIR:-/tmp}/process-industry-ai.XXXXXX")"
trap 'rm -rf "$STAGING"' EXIT

mkdir -p "$STAGING/$RELEASE_NAME/site" "$STAGING/$RELEASE_NAME/server"

cp -a "$OUT_DIR/". "$STAGING/$RELEASE_NAME/site/"
cp -a \
  server/ai.zlinfot.com.conf \
  server/staging.ai.zlinfot.com.conf \
  server/deploy.sh \
  server/rollback.sh \
  server/health-check.sh \
  server/enable-https.sh \
  server/install.sh \
  "$STAGING/$RELEASE_NAME/server/"

if [[ "$INCLUDE_BACKEND" == "1" ]]; then
  mkdir -p "$STAGING/$RELEASE_NAME/backend" "$STAGING/$RELEASE_NAME/server/systemd"
  cp -a \
    server/backend-deploy.sh \
    server/backend-rollback.sh \
    server/run-with-environment-file.py \
    "$STAGING/$RELEASE_NAME/server/"
  cp server/systemd/zlai-backend.service "$STAGING/$RELEASE_NAME/server/systemd/"

  # Backend code (excluding virtualenvs, caches, tests and local databases)
  find backend -type f \
    -not -path 'backend/.venv/*' \
    -not -path 'backend/tests/*' \
    -not -path 'backend/*.db' \
    -not -path '*/__pycache__/*' \
    -not -path 'backend/.pytest_cache/*' \
    -not -name '.env' \
    -not -name '.env.*' \
    -not -name '*.pyc' | while IFS= read -r file; do
      rel="${file#backend/}"
      dest="$STAGING/$RELEASE_NAME/backend/$rel"
      mkdir -p "$(dirname "$dest")"
      cp -a "$file" "$dest"
    done
fi

cat > "$STAGING/$RELEASE_NAME/RELEASE" <<EOF
release_name=$RELEASE_NAME
git_commit=$GIT_SHA
built_at=$BUILD_TIME
EOF

tar -C "$STAGING" -czf "$ARCHIVE" "$RELEASE_NAME"

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$ARCHIVE" > "$ARCHIVE.sha256"
else
  echo "错误：未找到 sha256sum 或 shasum，无法生成校验文件。" >&2
  rm -f "$ARCHIVE"
  exit 1
fi

echo "部署包：$ARCHIVE"
echo "校验文件：$ARCHIVE.sha256"
