#!/usr/bin/env bash
set -euo pipefail

URL="${HEALTH_URL:-http://127.0.0.1/}"
HOST="${HEALTH_HOST:-ai.zlinfot.com}"
ATTEMPTS="${HEALTH_ATTEMPTS:-5}"
DELAY="${HEALTH_DELAY_SECONDS:-2}"
EXPECTED_TEXT="${HEALTH_EXPECTED_TEXT:-流程工业 AI 与智能体}"

usage() {
  cat <<'EOF'
用法：health-check.sh [--url URL] [--host HOST] [--attempts N]

默认请求 http://127.0.0.1/，并发送 Host: ai.zlinfot.com。
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --url) URL="${2:?--url 缺少参数}"; shift 2 ;;
    --host) HOST="${2:?--host 缺少参数}"; shift 2 ;;
    --attempts) ATTEMPTS="${2:?--attempts 缺少参数}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "未知参数：$1" >&2; usage >&2; exit 2 ;;
  esac
done

[[ "$ATTEMPTS" =~ ^[1-9][0-9]*$ ]] || { echo "错误：attempts 必须是正整数。" >&2; exit 2; }
command -v curl >/dev/null 2>&1 || { echo "错误：健康检查需要 curl。" >&2; exit 1; }

TMP_BODY="$(mktemp "${TMPDIR:-/tmp}/zlinfot-health.XXXXXX")"
trap 'rm -f "$TMP_BODY"' EXIT

status=""
for ((try=1; try<=ATTEMPTS; try++)); do
  status="$(curl --silent --show-error --location --output "$TMP_BODY" \
    --write-out '%{http_code}' --connect-timeout 3 --max-time 10 \
    -H "Host: $HOST" "$URL" || true)"
  if [[ "$status" == "200" ]] && grep -Fq "$EXPECTED_TEXT" "$TMP_BODY"; then
    break
  fi
  if (( try < ATTEMPTS )); then sleep "$DELAY"; fi
done

if [[ "$status" != "200" ]]; then
  echo "健康检查失败：首页状态码为 ${status:-连接失败}。" >&2
  exit 1
fi
if ! grep -Fq "$EXPECTED_TEXT" "$TMP_BODY"; then
  echo "健康检查失败：首页缺少预期文本：$EXPECTED_TEXT" >&2
  exit 1
fi

# Vite 构建通常会在首页引用带哈希的 JS/CSS；至少验证第一个本地资源可访问。
asset="$(grep -Eo '(src|href)="/[^"]+\.(js|css)"' "$TMP_BODY" | head -n 1 | sed -E 's/^[^=]+="([^"]+)"$/\1/' || true)"
if [[ -z "$asset" ]]; then
  echo "健康检查失败：首页没有本地 JS/CSS 构建资源引用。" >&2
  exit 1
fi
base="${URL%/}"
asset_status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
  --connect-timeout 3 --max-time 10 -H "Host: $HOST" "$base$asset" || true)"
[[ "$asset_status" == "200" ]] || {
  echo "健康检查失败：静态资源 $asset 状态码为 ${asset_status:-连接失败}。" >&2
  exit 1
}

echo "健康检查通过：$URL (Host: $HOST, HTTP 200)"
