#!/usr/bin/env bash
set -euo pipefail

# 向后兼容入口。不会安装软件、修改防火墙、DNS 或 TLS。
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "install.sh 已改为安全的版本化部署入口。"
echo "它将安装仓库内的 HTTP Nginx 配置；现有配置会先备份。"
exec bash "$ROOT_DIR/server/deploy.sh" --install-nginx-config "$@"
