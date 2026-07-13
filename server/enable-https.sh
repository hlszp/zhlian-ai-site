#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "错误：请使用 root 执行。" >&2
  exit 1
fi

if [[ "${ALLOW_TLS_CHANGES:-}" != "yes" ]]; then
  cat >&2 <<'EOF'
已停止：TLS 属于独立生产变更。
确认 DNS 已指向本机、80/443 可达、证书回滚方案已准备并获得明确批准后，使用：
  sudo ALLOW_TLS_CHANGES=yes bash server/enable-https.sh
EOF
  exit 2
fi

command -v certbot >/dev/null 2>&1 || {
  echo "错误：未安装 certbot。请由管理员按当前操作系统的官方方式安装。" >&2
  exit 1
}
command -v nginx >/dev/null 2>&1 || { echo "错误：未安装 Nginx。" >&2; exit 1; }

BACKUP_DIR="/opt/zlinfot-ai/shared/nginx-backups"
CONFIG="/etc/nginx/conf.d/ai.zlinfot.com.conf"
mkdir -p "$BACKUP_DIR"
[[ -f "$CONFIG" ]] && cp -a "$CONFIG" "$BACKUP_DIR/ai.zlinfot.com.conf.pre-tls.$(date -u +%Y%m%d-%H%M%S)"

nginx -t
certbot --nginx -d ai.zlinfot.com --redirect
nginx -t
systemctl reload nginx

echo "TLS 配置完成。脚本未修改防火墙或 DNS；请执行 HTTPS 健康检查。"
