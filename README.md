# 致联信息｜流程工业 AI 与智能体网站

本仓库是 `https://ai.zlinfot.com` 的唯一源代码仓库。网站采用 React、TypeScript 和 Vite 构建为静态文件，并由 Nginx 托管。

## 项目小结

这是 ZHILIAN 的流程工业 AI 与智能体知识网站。当前版本以一个轻量、可持续扩展的静态站点为目标：用案例、方法、论文和工具信息帮助读者理解流程工业中的 AI 应用，暂不承担登录、在线推理、交易或后台管理职能。

当前内容仍集中在 `src/App.tsx`，`src/styles.css` 负责视觉样式；`content/` 已预留为下一阶段的内容数据目录。后续增加知识和案例时，应优先保持内容结构清晰、来源可追溯，并避免把未经核验的宣传性结论写入页面。

仓库中的 `zhilianAI-guid.md` 是项目工作指引，不参与构建和部署，也不应被提交进发布包。

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

项目有两条 GitHub Actions 工作流：

- [`ci.yml`](.github/workflows/ci.yml)：在 Pull Request 和 `main` 推送时运行 `npm ci`、Vite 构建、部署脚本测试和发布包校验；它不读取生产密钥。
- [`deploy.yml`](.github/workflows/deploy.yml)：在 `main` 推送或手动触发时运行生产发布。它先等待同一工作流的 `build` Job 成功，再把经过 SHA-256 校验的发布包传给独立的 `deploy` Job。

生产部署的具体链路如下：

1. `build` Job 在无生产密钥的 Runner 上安装依赖、运行 `bash tests/deploy-scripts.sh`、执行 `scripts/package.sh`，并上传只包含静态文件、服务器脚本、Nginx 配置和 `RELEASE` 元数据的 Artifact。
2. `deploy` Job 进入 GitHub `production` Environment，只下载并再次校验 Artifact，不 checkout 源代码，也不在密钥落盘后执行工作区脚本。
3. 工作流使用固定的 SSH host key 和专用 `PROD_SSH_KEY`，将包上传到服务器的 `/var/tmp/zhilian-deploy/<release-id>`。
4. 服务器再次校验 SHA-256 和 tar 路径，使用无 sudo 的 `zhilian-deploy` 执行 `server/deploy.sh --static-only`。部署通过 `flock` 串行化，创建新 release 后原子切换 `current`，不 reload Nginx。
5. Runner 通过 `PROD_URL` 检查首页文本和首个 JS/CSS 资源。公网检查失败时，工作流只在确认失败版本仍是 `current` 后执行静态回滚，并清理远程临时包和 Runner 上的 SSH 材料。

自动部署的日常使用方式：

- 普通更新：创建 PR，等待 `CI` 通过，合并到 `main`；合并会自动触发生产部署。
- 手动发布：在 GitHub Actions 中选择 `Deploy production`，点击 `Run workflow`，目标分支选择 `main`。
- 查看结果：检查 `CI` 和 `Deploy production` 两个工作流；生产页面和静态资源必须返回 HTTP 200。
- 需要回退时：优先在 Actions 中重新运行失败的 `Deploy production` 工作流；必要时由管理员 SSH 登录服务器执行 `bash server/rollback.sh --app-root /opt/zlinfot-ai --static-only`。

正常内容发布不需要手工连接云服务器，也不需要修改 DNS、TLS、防火墙或 Nginx 配置。只有基础设施变更和首次服务器初始化才需要管理员操作和单独批准。

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

其中 `PROD_SSH_KEY` 只在 `deploy` Job 的 SSH 配置步骤注入；不要把私钥、host key、服务器密码或任何 `.env` 文件写入仓库。`production` Environment 当前限定部署分支为 `main`，并通过 `concurrency` 保证同一时间只有一个生产发布。

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
