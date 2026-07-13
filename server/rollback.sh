#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/zlinfot-ai}"
TARGET=""
SKIP_NGINX=0
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  cat <<'EOF'
用法：sudo bash server/rollback.sh [--release-id ID] [--app-root PATH] [--skip-nginx]

不指定 release ID 时回滚到 previous。--skip-nginx 仅供隔离环境验证。
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-id) TARGET="${2:?--release-id 缺少参数}"; shift 2 ;;
    --app-root) APP_ROOT="${2:?--app-root 缺少参数}"; shift 2 ;;
    --skip-nginx) SKIP_NGINX=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数：$1" >&2; usage >&2; exit 2 ;;
  esac
done

if (( ! SKIP_NGINX )) && [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "错误：生产回滚请使用 root 执行。" >&2
  exit 1
fi
[[ "$APP_ROOT" == /* ]] || { echo "错误：app root 必须是绝对路径。" >&2; exit 2; }

CURRENT="$APP_ROOT/current"
PREVIOUS="$APP_ROOT/previous"

# 必须在切换任何链接之前拒绝异常路径，避免把真实目录当作链接处理。
for link_path in "$CURRENT" "$PREVIOUS"; do
  if [[ ( -e "$link_path" || -L "$link_path" ) && ! -L "$link_path" ]]; then
    echo "错误：$link_path 已存在但不是软链接；拒绝回滚。" >&2
    exit 1
  fi
done

atomic_link() {
  local target="$1"
  local link_path="$2"
  local temporary="${link_path}.tmp.$$"
  rm -f "$temporary"
  ln -s "$target" "$temporary"
  if mv --help 2>/dev/null | grep -q -- '-T'; then
    mv -Tf "$temporary" "$link_path"
  else
    mv -fh "$temporary" "$link_path"
  fi
}

[[ -L "$CURRENT" ]] || { echo "错误：current 不是有效软链接。" >&2; exit 1; }
OLD_CURRENT="$(readlink "$CURRENT")"

if [[ -z "$TARGET" ]]; then
  [[ -L "$PREVIOUS" ]] || { echo "错误：没有 previous 版本可回滚。" >&2; exit 1; }
  TARGET_LINK="$(readlink "$PREVIOUS")"
else
  [[ "$TARGET" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo "错误：release ID 格式无效。" >&2; exit 2; }
  TARGET_LINK="releases/$TARGET"
fi

TARGET_DIR="$APP_ROOT/$TARGET_LINK"
[[ -f "$TARGET_DIR/index.html" ]] || { echo "错误：目标 release 无效：$TARGET_DIR" >&2; exit 1; }
[[ "$TARGET_LINK" != "$OLD_CURRENT" ]] || { echo "错误：目标已经是 current。" >&2; exit 1; }

if (( ! SKIP_NGINX )); then
  command -v nginx >/dev/null 2>&1 || { echo "错误：未找到 Nginx。" >&2; exit 1; }
  nginx -t
fi

atomic_link "$TARGET_LINK" "$CURRENT"

restore_current() {
  echo "回滚验证失败，正在恢复原 current。" >&2
  atomic_link "$OLD_CURRENT" "$CURRENT"
  if (( ! SKIP_NGINX )); then nginx -t && systemctl reload nginx || true; fi
}

if (( ! SKIP_NGINX )); then
  if ! nginx -t || ! systemctl reload nginx || ! bash "$ROOT_DIR/server/health-check.sh"; then
    restore_current
    exit 1
  fi
fi

atomic_link "$OLD_CURRENT" "$PREVIOUS"
echo "回滚完成：current -> $(readlink "$CURRENT")"
echo "可重做版本：previous -> $(readlink "$PREVIOUS")"
