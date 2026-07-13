#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/zlinfot-ai}"
TARGET=""
RELOAD_NGINX=1
RUN_HEALTH_CHECK=1
DEPLOY_LOCK_MODE="${DEPLOY_LOCK_MODE:-auto}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

usage() {
  cat <<'EOF'
用法：bash server/rollback.sh [选项]

选项：
  --release-id ID          回滚到指定 release；默认使用 previous
  --app-root PATH          发布根目录（默认 /opt/zlinfot-ai）
  --static-only            非 root 静态回滚；不检查/reload Nginx，仍执行健康检查
  --no-nginx-reload        --static-only 的同义选项
  --skip-health            不执行 HTTP 健康检查
  --skip-nginx             兼容旧用法；等同于 --static-only --skip-health
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-id) TARGET="${2:?--release-id 缺少参数}"; shift 2 ;;
    --app-root) APP_ROOT="${2:?--app-root 缺少参数}"; shift 2 ;;
    --static-only|--no-nginx-reload) RELOAD_NGINX=0; shift ;;
    --skip-health) RUN_HEALTH_CHECK=0; shift ;;
    --skip-nginx) RELOAD_NGINX=0; RUN_HEALTH_CHECK=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数：$1" >&2; usage >&2; exit 2 ;;
  esac
done

if (( RELOAD_NGINX && ${EUID:-$(id -u)} != 0 )); then
  echo "错误：reload Nginx 请使用 root；普通静态回滚请加 --static-only。" >&2
  exit 1
fi
[[ "$APP_ROOT" == /* ]] || { echo "错误：app root 必须是绝对路径。" >&2; exit 2; }

CURRENT="$APP_ROOT/current"
PREVIOUS="$APP_ROOT/previous"
LOCK_DIR="$APP_ROOT/.deploy-lock"
LOCK_FILE="$APP_ROOT/.deploy.lock"
LOCK_USES_DIR=0
SWITCHED=0
ROLLBACK_COMMITTED=0

[[ -d "$APP_ROOT" ]] || { echo "错误：app root 不存在：$APP_ROOT" >&2; exit 1; }
[[ "$DEPLOY_LOCK_MODE" =~ ^(auto|flock|mkdir)$ ]] || { echo "错误：DEPLOY_LOCK_MODE 必须是 auto、flock 或 mkdir。" >&2; exit 2; }
if [[ "$DEPLOY_LOCK_MODE" != "mkdir" ]] && command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "错误：检测到另一个部署或回滚任务（$LOCK_FILE）。" >&2
    exit 1
  fi
elif [[ "$DEPLOY_LOCK_MODE" == "flock" ]]; then
  echo "错误：系统缺少 flock，无法获取部署锁。" >&2
  exit 1
else
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "错误：检测到另一个部署或回滚任务（$LOCK_DIR）。" >&2
    exit 1
  fi
  LOCK_USES_DIR=1
fi

cleanup() {
  local status=$?
  trap - EXIT INT TERM HUP
  if (( status != 0 && SWITCHED && ! ROLLBACK_COMMITTED )); then
    restore_current || true
  fi
  if (( LOCK_USES_DIR )); then rmdir "$LOCK_DIR" 2>/dev/null || true; fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

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

if (( RELOAD_NGINX )); then
  command -v nginx >/dev/null 2>&1 || { echo "错误：未找到 Nginx。" >&2; exit 1; }
  nginx -t
fi

atomic_link "$TARGET_LINK" "$CURRENT"
SWITCHED=1

restore_current() {
  echo "回滚验证失败，正在恢复原 current。" >&2
  atomic_link "$OLD_CURRENT" "$CURRENT"
  if (( RELOAD_NGINX )); then nginx -t && systemctl reload nginx || true; fi
  SWITCHED=0
}

if (( RELOAD_NGINX )); then
  if ! nginx -t || ! systemctl reload nginx; then
    exit 1
  fi
fi
if (( RUN_HEALTH_CHECK )); then
  if ! bash "$ROOT_DIR/server/health-check.sh"; then
    exit 1
  fi
fi

atomic_link "$OLD_CURRENT" "$PREVIOUS"
ROLLBACK_COMMITTED=1
echo "回滚完成：current -> $(readlink "$CURRENT")"
echo "可重做版本：previous -> $(readlink "$PREVIOUS")"
