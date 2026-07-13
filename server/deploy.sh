#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/zlinfot-ai}"
NGINX_CONFIG="${NGINX_CONFIG:-/etc/nginx/conf.d/ai.zlinfot.com.conf}"
RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%d-%H%M%S)}"
INSTALL_NGINX_CONFIG=0
SKIP_NGINX=0
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SITE_DIR="$ROOT_DIR/site"

usage() {
  cat <<'EOF'
用法：sudo bash server/deploy.sh [选项]

选项：
  --release-id ID          指定唯一发布 ID（默认 UTC 时间）
  --app-root PATH          发布根目录（默认 /opt/zlinfot-ai）
  --install-nginx-config   备份并安装包内 Nginx HTTP 配置
  --skip-nginx             仅供隔离环境验证，不检查/reload Nginx，也不执行 HTTP 健康检查

脚本不会安装软件，也不会修改 DNS、防火墙或 TLS。
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release-id) RELEASE_ID="${2:?--release-id 缺少参数}"; shift 2 ;;
    --app-root) APP_ROOT="${2:?--app-root 缺少参数}"; shift 2 ;;
    --install-nginx-config) INSTALL_NGINX_CONFIG=1; shift ;;
    --skip-nginx) SKIP_NGINX=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数：$1" >&2; usage >&2; exit 2 ;;
  esac
done

if (( ! SKIP_NGINX )) && [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "错误：生产部署请使用 root 执行。" >&2
  exit 1
fi
[[ "$RELEASE_ID" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo "错误：release ID 只能包含字母、数字、点、下划线和连字符。" >&2; exit 2; }
[[ "$APP_ROOT" == /* ]] || { echo "错误：app root 必须是绝对路径。" >&2; exit 2; }
[[ -f "$SITE_DIR/index.html" ]] || { echo "错误：部署包缺少 site/index.html。" >&2; exit 1; }

RELEASES="$APP_ROOT/releases"
RELEASE_DIR="$RELEASES/$RELEASE_ID"
CURRENT="$APP_ROOT/current"
PREVIOUS="$APP_ROOT/previous"
LOCK_DIR="$APP_ROOT/.deploy-lock"
OLD_CURRENT=""
OLD_PREVIOUS=""
SWITCHED=0
CONFIG_BACKUP=""
CONFIG_WAS_ABSENT=0

# 必须在创建 release、备份/安装配置等任何修改之前拒绝异常路径。
for link_path in "$CURRENT" "$PREVIOUS"; do
  if [[ ( -e "$link_path" || -L "$link_path" ) && ! -L "$link_path" ]]; then
    echo "错误：$link_path 已存在但不是软链接；拒绝部署。" >&2
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
    # BSD mv 没有 -T；-h 保证目标软链接本身被替换，而不是跟随至目录。
    mv -fh "$temporary" "$link_path"
  fi
}

mkdir -p "$APP_ROOT" "$RELEASES" "$APP_ROOT/shared"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "错误：检测到另一个部署任务（$LOCK_DIR）。" >&2
  exit 1
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

[[ ! -e "$RELEASE_DIR" ]] || { echo "错误：release 已存在：$RELEASE_DIR" >&2; exit 1; }

if [[ -L "$CURRENT" ]]; then OLD_CURRENT="$(readlink "$CURRENT")"; fi
if [[ -L "$PREVIOUS" ]]; then OLD_PREVIOUS="$(readlink "$PREVIOUS")"; fi

mkdir "$RELEASE_DIR"
cp -a "$SITE_DIR/." "$RELEASE_DIR/"
[[ -f "$ROOT_DIR/RELEASE" ]] && cp -a "$ROOT_DIR/RELEASE" "$RELEASE_DIR/RELEASE"
find "$RELEASE_DIR" -type d -exec chmod 0755 {} +
find "$RELEASE_DIR" -type f -exec chmod 0644 {} +

if (( INSTALL_NGINX_CONFIG )); then
  [[ -f "$ROOT_DIR/server/ai.zlinfot.com.conf" ]] || { echo "错误：缺少 Nginx 配置模板。" >&2; exit 1; }
  mkdir -p "$(dirname "$NGINX_CONFIG")" "$APP_ROOT/shared/nginx-backups"
  if [[ -f "$NGINX_CONFIG" ]]; then
    CONFIG_BACKUP="$APP_ROOT/shared/nginx-backups/ai.zlinfot.com.conf.$(date -u +%Y%m%d-%H%M%S)"
    cp -a "$NGINX_CONFIG" "$CONFIG_BACKUP"
  else
    CONFIG_WAS_ABSENT=1
  fi
  install -m 0644 "$ROOT_DIR/server/ai.zlinfot.com.conf" "$NGINX_CONFIG"
fi

restore_nginx_config() {
  if [[ -n "$CONFIG_BACKUP" ]]; then
    cp -a "$CONFIG_BACKUP" "$NGINX_CONFIG"
  elif (( CONFIG_WAS_ABSENT )); then
    rm -f "$NGINX_CONFIG"
  fi
}

if (( ! SKIP_NGINX )); then
  if ! command -v nginx >/dev/null 2>&1; then
    echo "错误：未安装 Nginx；请先由管理员完成安装。" >&2
    restore_nginx_config
    exit 1
  fi
  # 首次发布时先建立 current，使 Nginx 配置测试有有效 root。
  if [[ ! -L "$CURRENT" ]]; then atomic_link "releases/$RELEASE_ID" "$CURRENT"; SWITCHED=1; fi
  if ! nginx -t; then
    [[ -z "$OLD_CURRENT" ]] && rm -f "$CURRENT"
    restore_nginx_config
    nginx -t && systemctl reload nginx || true
    exit 1
  fi
fi

if [[ "$SWITCHED" -eq 0 ]]; then
  if [[ -n "$OLD_CURRENT" ]]; then atomic_link "$OLD_CURRENT" "$PREVIOUS"; fi
  atomic_link "releases/$RELEASE_ID" "$CURRENT"
  SWITCHED=1
fi

rollback_on_failure() {
  echo "部署验证失败，正在恢复部署前版本。" >&2
  if [[ -n "$OLD_CURRENT" ]]; then
    atomic_link "$OLD_CURRENT" "$CURRENT"
  else
    rm -f "$CURRENT"
  fi
  if [[ -n "$OLD_PREVIOUS" ]]; then atomic_link "$OLD_PREVIOUS" "$PREVIOUS"; else rm -f "$PREVIOUS"; fi
  restore_nginx_config
  if (( ! SKIP_NGINX )); then nginx -t && systemctl reload nginx || true; fi
}

if (( ! SKIP_NGINX )); then
  if ! nginx -t || ! systemctl reload nginx || ! bash "$ROOT_DIR/server/health-check.sh"; then
    rollback_on_failure
    exit 1
  fi
fi

cat > "$RELEASE_DIR/DEPLOYMENT" <<EOF
release_id=$RELEASE_ID
deployed_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
previous=${OLD_CURRENT:-none}
health_check=$([[ "$SKIP_NGINX" -eq 1 ]] && echo skipped || echo passed)
EOF
chmod 0644 "$RELEASE_DIR/DEPLOYMENT"

echo "部署完成：$RELEASE_DIR"
echo "current -> $(readlink "$CURRENT")"
if [[ -L "$PREVIOUS" ]]; then
  echo "previous -> $(readlink "$PREVIOUS")"
fi
