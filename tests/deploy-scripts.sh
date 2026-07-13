#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/zlinfot-deploy-test.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT

PACKAGE_ROOT="$WORK_DIR/package"
APP_ROOT="$WORK_DIR/app"
FAKE_BIN="$WORK_DIR/bin"
export DEPLOY_LOCK_MODE=mkdir

mkdir -p "$PACKAGE_ROOT/server" "$PACKAGE_ROOT/site/assets" "$FAKE_BIN"
cp "$REPO_ROOT/server/deploy.sh" "$REPO_ROOT/server/rollback.sh" \
  "$REPO_ROOT/server/health-check.sh" "$PACKAGE_ROOT/server/"
printf '%s\n' '<!doctype html><html><body>流程工业 AI 与智能体<script src="/assets/app.js"></script></body></html>' \
  > "$PACKAGE_ROOT/site/index.html"
printf '%s\n' 'console.log("ok")' > "$PACKAGE_ROOT/site/assets/app.js"

# health-check.sh 只需要 curl 写入首页响应并返回状态码。静态资源请求输出 200。
cat > "$FAKE_BIN/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
output=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) output="$2"; shift 2 ;;
    *) shift ;;
  esac
done
if [[ -n "$output" && "$output" != "/dev/null" ]]; then
  printf '%s\n' '<!doctype html><html><body>流程工业 AI 与智能体<script src="/assets/app.js"></script></body></html>' > "$output"
fi
printf '200'
EOF
chmod +x "$FAKE_BIN/curl"

assert_link() {
  local link_path="$1"
  local expected="$2"
  [[ -L "$link_path" ]] || { echo "断言失败：$link_path 不是软链接" >&2; exit 1; }
  [[ "$(readlink "$link_path")" == "$expected" ]] || {
    echo "断言失败：$link_path -> $(readlink "$link_path")，预期 $expected" >&2
    exit 1
  }
}

PATH="$FAKE_BIN:$PATH" HEALTH_ATTEMPTS=1 HEALTH_DELAY_SECONDS=0 \
  bash "$PACKAGE_ROOT/server/deploy.sh" --app-root "$APP_ROOT" --release-id release-1 --static-only
assert_link "$APP_ROOT/current" "releases/release-1"
grep -Fq 'nginx_reload=skipped' "$APP_ROOT/releases/release-1/DEPLOYMENT"
grep -Fq 'health_check=passed' "$APP_ROOT/releases/release-1/DEPLOYMENT"

# --skip-nginx 保留旧语义：不 reload Nginx，也不执行健康检查。
bash "$PACKAGE_ROOT/server/deploy.sh" --app-root "$APP_ROOT" --release-id release-2 --skip-nginx
assert_link "$APP_ROOT/current" "releases/release-2"
assert_link "$APP_ROOT/previous" "releases/release-1"
grep -Fq 'health_check=skipped' "$APP_ROOT/releases/release-2/DEPLOYMENT"

PATH="$FAKE_BIN:$PATH" HEALTH_ATTEMPTS=1 HEALTH_DELAY_SECONDS=0 \
  bash "$PACKAGE_ROOT/server/rollback.sh" --app-root "$APP_ROOT" --static-only
assert_link "$APP_ROOT/current" "releases/release-1"
assert_link "$APP_ROOT/previous" "releases/release-2"

# 部署和回滚必须使用同一把锁，并且锁冲突不能改变 current。
mkdir "$APP_ROOT/.deploy-lock"
if bash "$PACKAGE_ROOT/server/deploy.sh" --app-root "$APP_ROOT" --release-id locked --skip-nginx >/dev/null 2>&1; then
  echo "断言失败：部署未拒绝已有锁" >&2
  exit 1
fi
if bash "$PACKAGE_ROOT/server/rollback.sh" --app-root "$APP_ROOT" --skip-nginx >/dev/null 2>&1; then
  echo "断言失败：回滚未拒绝已有锁" >&2
  exit 1
fi
assert_link "$APP_ROOT/current" "releases/release-1"
rmdir "$APP_ROOT/.deploy-lock"

# 非 root 静态发布健康检查失败时，必须恢复发布前的 current/previous。
cat > "$FAKE_BIN/curl" <<'EOF'
#!/usr/bin/env bash
printf '503'
EOF
chmod +x "$FAKE_BIN/curl"
if PATH="$FAKE_BIN:$PATH" HEALTH_ATTEMPTS=1 HEALTH_DELAY_SECONDS=0 \
  bash "$PACKAGE_ROOT/server/deploy.sh" --app-root "$APP_ROOT" --release-id unhealthy --static-only >/dev/null 2>&1; then
  echo "断言失败：健康检查失败的部署返回了成功" >&2
  exit 1
fi
assert_link "$APP_ROOT/current" "releases/release-1"
assert_link "$APP_ROOT/previous" "releases/release-2"
[[ ! -d "$APP_ROOT/.deploy-lock" ]] || { echo "断言失败：失败后未释放部署锁" >&2; exit 1; }

# 回滚健康检查失败时，也必须恢复回滚前的 current/previous。
if PATH="$FAKE_BIN:$PATH" HEALTH_ATTEMPTS=1 HEALTH_DELAY_SECONDS=0 \
  bash "$PACKAGE_ROOT/server/rollback.sh" --app-root "$APP_ROOT" --static-only >/dev/null 2>&1; then
  echo "断言失败：健康检查失败的回滚返回了成功" >&2
  exit 1
fi
assert_link "$APP_ROOT/current" "releases/release-1"
assert_link "$APP_ROOT/previous" "releases/release-2"
[[ ! -d "$APP_ROOT/.deploy-lock" ]] || { echo "断言失败：回滚失败后未释放部署锁" >&2; exit 1; }

# 部署进程收到 TERM 时，EXIT 事务清理仍必须恢复 current/previous。
cat > "$FAKE_BIN/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
deploy_pid="$(ps -o ppid= -p "$PPID" | tr -d ' ')"
kill -TERM "$deploy_pid"
printf '503'
EOF
chmod +x "$FAKE_BIN/curl"
if PATH="$FAKE_BIN:$PATH" HEALTH_ATTEMPTS=1 HEALTH_DELAY_SECONDS=0 \
  bash "$PACKAGE_ROOT/server/deploy.sh" --app-root "$APP_ROOT" --release-id interrupted --static-only >/dev/null 2>&1; then
  echo "断言失败：收到 TERM 的部署返回了成功" >&2
  exit 1
fi
assert_link "$APP_ROOT/current" "releases/release-1"
assert_link "$APP_ROOT/previous" "releases/release-2"
[[ ! -d "$APP_ROOT/.deploy-lock" ]] || { echo "断言失败：TERM 后未释放部署锁" >&2; exit 1; }

echo "部署脚本测试通过"
