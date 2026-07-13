#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then echo "请使用 root 执行：sudo bash server/install.sh"; exit 1; fi
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v nginx >/dev/null 2>&1; then
  yum install -y epel-release || true
  yum install -y nginx || { echo "Nginx 安装失败。CentOS 7 软件源可能已失效，请先修复 yum 源。"; exit 1; }
fi

mkdir -p /var/www/ai.zlinfot.com
rsync -a --delete "$ROOT_DIR/site/" /var/www/ai.zlinfot.com/
install -m 0644 "$ROOT_DIR/server/ai.zlinfot.com.conf" /etc/nginx/conf.d/ai.zlinfot.com.conf
chown -R nginx:nginx /var/www/ai.zlinfot.com 2>/dev/null || chown -R root:root /var/www/ai.zlinfot.com
nginx -t
systemctl enable nginx
systemctl restart nginx
firewall-cmd --permanent --add-service=http >/dev/null 2>&1 || true
firewall-cmd --reload >/dev/null 2>&1 || true
echo "部署完成。测试：curl -I -H 'Host: ai.zlinfot.com' http://127.0.0.1"
