#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build
rm -rf site
mkdir -p site
cp -a dist/. site/
ARCHIVE="process-industry-ai-$(date -u +%Y%m%d-%H%M%S).tar.gz"
TMP_ARCHIVE="${TMPDIR:-/tmp}/$ARCHIVE"
rm -f "$TMP_ARCHIVE"
tar -czf "$TMP_ARCHIVE" --exclude=node_modules --exclude=dist --exclude=.git --exclude=.npm-cache --exclude='*.tar.gz' --exclude='*.sha256' .
mv "$TMP_ARCHIVE" "$ARCHIVE"
sha256sum "$ARCHIVE" > "$ARCHIVE.sha256"
echo "$ARCHIVE"
