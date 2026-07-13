# 致联信息｜流程工业 AI 与智能体网站

本仓库是 `https://ai.zlinfot.com` 的唯一源代码仓库。网站采用 React、TypeScript 和 Vite 构建为静态文件，并由 Nginx 托管。

## 本地开发与验证

```bash
npm ci
npm run dev
```

发布前至少执行：

```bash
npm ci
npm run build
bash scripts/package.sh
```

`package.sh` 会重新构建网站，并生成：

```text
process-industry-ai-<UTC时间>.tar.gz
process-industry-ai-<UTC时间>.tar.gz.sha256
```

压缩包仅包含构建后的 `site/`、服务器部署脚本、Nginx 配置和发布元数据，不包含源代码、依赖、密钥或本地缓存。macOS 和 Linux 分别使用 `shasum` 或 `sha256sum` 生成 SHA-256。

## 部署架构

服务器采用不可变的版本目录，不直接覆盖唯一站点目录：

```text
/opt/zlinfot-ai/
├── releases/<release-id>/
├── current  -> releases/<current>
├── previous -> releases/<previous>
└── shared/
    └── nginx-backups/
```

Nginx 的站点根目录固定指向 `/opt/zlinfot-ai/current`。每次部署创建新 release，通过软链接切换版本；健康检查失败时自动恢复原链接。

普通内容发布不需要 reload Nginx。`zhilian-deploy` 只需拥有 `/opt/zlinfot-ai` 和 `/var/tmp/zhilian-deploy`，通过 `--static-only` 创建 release 并原子切换软链接。部署与回滚优先共用 `/opt/zlinfot-ai/.deploy.lock` 的 `flock` 文件锁，进程异常退出时由内核自动释放；缺少 `flock` 的本地环境回退为目录锁，避免两个任务同时改动版本指针。

## 生产变更边界

连接服务器前需获得明确授权。首次操作只做系统、端口、已有站点、Nginx、防火墙、SELinux 和软件源的只读检查。以下操作分别需要人工确认：

- 安装或修改 Nginx；
- 部署生产 release；
- 修改 DNS；
- 修改安全组或防火墙；
- 申请、安装或更新 TLS 证书。

部署脚本本身不会安装软件，也不会修改 DNS、防火墙或 TLS。若发现服务器已有生产服务，不得直接覆盖。

## 上传与校验

在本地确认校验值：

```bash
sha256sum -c process-industry-ai-<UTC时间>.tar.gz.sha256
# macOS 可使用：shasum -a 256 -c <校验文件>
```

将压缩包和 `.sha256` 上传到服务器，在服务器再次校验后解压：

```bash
sha256sum -c process-industry-ai-<UTC时间>.tar.gz.sha256
tar -xzf process-industry-ai-<UTC时间>.tar.gz
cd process-industry-ai-<UTC时间>
```

## 首次部署

前提：管理员已经安装并启动 Nginx，且确认包内配置不会与已有虚拟主机冲突。

```bash
sudo bash server/deploy.sh --install-nginx-config
```

该选项会把已有站点配置备份到 `/opt/zlinfot-ai/shared/nginx-backups/`，执行 `nginx -t` 后才 reload。旧的入口命令仍可使用，行为相同：

```bash
sudo bash server/install.sh
```

首次发布后验证：

```bash
curl -I -H 'Host: ai.zlinfot.com' http://127.0.0.1/
sudo bash server/health-check.sh
```

## 后续发布

已有 Nginx 配置时不再覆盖配置：

```bash
sudo bash server/deploy.sh --release-id 20260713-001
```

脚本依次执行：创建 release、保存发布元数据、更新 `previous`、切换 `current`、测试并 reload Nginx、检查首页和首个 JS/CSS 资源。失败时自动恢复部署前的 `current`。

管理员无需 reload Nginx 的静态发布可以显式执行：

```bash
bash server/deploy.sh --release-id 20260713-001 --static-only
```

该模式不需要 root，不读写 Nginx 配置，仍会执行 HTTP 健康检查并在失败时恢复版本。`--skip-health` 可单独关闭健康检查；旧的 `--skip-nginx` 参数继续可用，并保持“跳过 Nginx 和健康检查”的原有行为。

如需从运维系统覆盖路径或检查地址，可使用环境变量：

```bash
APP_ROOT=/opt/zlinfot-ai \
HEALTH_URL=http://127.0.0.1/ \
HEALTH_HOST=ai.zlinfot.com \
sudo -E bash server/deploy.sh --release-id 20260713-001
```

## 应用回滚

默认回滚至 `previous`：

```bash
sudo bash server/rollback.sh
```

也可指定仍保留在 `releases/` 中的版本：

```bash
sudo bash server/rollback.sh --release-id 20260713-001
```

回滚同样执行 Nginx 配置测试、reload 和健康检查；失败时恢复回滚前版本。回滚成功后，原版本保存在 `previous`，便于重做。

部署账号执行静态回滚：

```bash
bash server/rollback.sh --app-root /opt/zlinfot-ai --static-only
```

部署和回滚使用同一把锁；自动部署运行期间，另一项发布或回滚会安全失败，不会交叉切换软链接。

Nginx 配置异常时，可从 `/opt/zlinfot-ai/shared/nginx-backups/` 恢复备份，随后执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## GitHub Actions 自动部署

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 在代码推送到 `main` 后自动部署，也支持在 Actions 页面手动触发。工作流会完成构建、SHA-256 校验、SSH 上传、服务器再次校验、非 root 原子发布、服务器本地健康检查和公网 HTTP 健康检查。公网检查失败时会自动回滚到 `previous`。

GitHub 仓库需要创建名为 `production` 的 Environment，并配置：

| 类型 | 名称 | 示例或说明 |
| --- | --- | --- |
| Variable | `PROD_HOST` | `101.200.186.149` |
| Variable | `PROD_PORT` | `22334` |
| Variable | `PROD_USER` | `zhilian-deploy` |
| Variable | `PROD_URL` | `http://ai.zlinfot.com/`；启用 HTTPS 后再更新 |
| Variable | `PROD_UPLOAD_DIR` | `/var/tmp/zhilian-deploy` |
| Secret | `PROD_SSH_KEY` | 仅供 GitHub Actions 使用的部署私钥 |
| Secret | `PROD_KNOWN_HOSTS` | 经管理员核验的服务器 SSH host key，非运行时自动信任 |

服务器需要一次性完成：

- 创建无密码、无 sudo 的 `zhilian-deploy` 用户；
- 将专用公钥加入该用户的 `authorized_keys`；
- 让该用户拥有 `/opt/zlinfot-ai` 和 `/var/tmp/zhilian-deploy`；
- 保持 Nginx 读取 `/opt/zlinfot-ai/current`，并确保目录和文件分别可读/执行；
- 管理员核对 SSH 指纹后，把 `ssh-keyscan -p 22334 101.200.186.149` 对应的已验证记录保存为 `PROD_KNOWN_HOSTS`。

自动部署不持有 root 或 sudo 权限，也不会修改 Nginx、DNS、防火墙或 TLS。GitHub `production` Environment 可按需要增加 required reviewers；配置后，正常内容更新只需合并到 `main`，不再手工连接服务器。

本地验证部署脚本：

```bash
bash tests/deploy-scripts.sh
```

## DNS 与 HTTPS

在本机构建、服务器部署、本机 Host Header 测试和公网 IP 测试全部通过前，保留现有 DNS。DNS 切换和 HTTPS 启用不属于普通 release 部署，必须分别确认并保留 DNS、Nginx 配置及证书回滚路径。

仓库内的 Nginx 配置是用于 DNS 切换前验收的 HTTP 配置。正式 DNS 生效并确认 80/443 可达后，才可按批准的 TLS 方案启用 HTTPS 和 HTTP 跳转。

## 运维记录

每次生产发布至少记录：

- Git commit SHA 和部署包 SHA-256；
- 发布时间、发布人员、release 目录；
- 变更摘要；
- `nginx -t`、首页和静态资源健康检查结果；
- 必要时的回滚结果。

CentOS 7 已停止官方维护，建议迁移至 Alibaba Cloud Linux 3 或 Ubuntu 22.04/24.04 LTS。
