#!/usr/bin/env bash
set -euo pipefail
if [[ ${EUID} -ne 0 ]]; then echo "请使用 root 执行：sudo bash server/enable-https.sh"; exit 1; fi
echo "运行前请确认 ai.zlinfot.com 已解析到本服务器 101.200.186.149，且安全组已开放 80/443。"
yum install -y epel-release || true
yum install -y certbot python2-certbot-nginx || yum install -y certbot python3-certbot-nginx
certbot --nginx -d ai.zlinfot.com --redirect
nginx -t && systemctl reload nginx
firewall-cmd --permanent --add-service=https >/dev/null 2>&1 || true
firewall-cmd --reload >/dev/null 2>&1 || true
