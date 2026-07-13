#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

command -v npm >/dev/null 2>&1 || { echo "错误：未找到 npm。" >&2; exit 1; }
command -v tar >/dev/null 2>&1 || { echo "错误：未找到 tar。" >&2; exit 1; }

npm run build

[[ -f dist/index.html ]] || { echo "错误：构建结果缺少 dist/index.html。" >&2; exit 1; }

BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
STAMP="$(date -u +%Y%m%d-%H%M%S)"
GIT_SHA="$(git rev-parse HEAD 2>/dev/null || printf 'unknown')"
RELEASE_NAME="process-industry-ai-$STAMP"
ARCHIVE="$RELEASE_NAME.tar.gz"
STAGING="$(mktemp -d "${TMPDIR:-/tmp}/process-industry-ai.XXXXXX")"
trap 'rm -rf "$STAGING"' EXIT

mkdir -p "$STAGING/$RELEASE_NAME/site" "$STAGING/$RELEASE_NAME/server"
cp -a dist/. "$STAGING/$RELEASE_NAME/site/"
cp -a \
  server/ai.zlinfot.com.conf \
  server/deploy.sh \
  server/enable-https.sh \
  server/health-check.sh \
  server/install.sh \
  server/rollback.sh \
  "$STAGING/$RELEASE_NAME/server/"

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
