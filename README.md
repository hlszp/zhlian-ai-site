# 致联信息｜流程工业 AI 与智能体网站

本仓库是 `https://ai.zlinfot.com` 的唯一源代码仓库。网站采用 React、TypeScript 和 Vite 构建为静态文件，并由 Nginx 托管。

## 本地开发

```bash
npm ci
npm run dev
```

## 构建验证

```bash
npm run build
```

## 生成部署包

```bash
bash scripts/package.sh
```

以下是当前 CentOS 7.9 服务器的手动部署说明。

目标服务器：`101.200.186.149`  
正式域名：`ai.zlinfot.com`

## 部署前检查

1. 阿里云安全组入方向开放 TCP 80、443；SSH 22 仅允许管理员 IP。
2. 若服务器位于中国内地，确认 `zlinfot.com` 已完成 ICP 备案。
3. 暂时保留当前 Sites 的 CNAME，先完成服务器部署和本机测试。

## 上传与安装

将压缩包上传到服务器后执行：

```bash
tar -xzf process-industry-ai-centos7.tar.gz
cd process-industry-ai-centos7
sudo bash server/install.sh
```

服务器本机测试：

```bash
curl -I -H 'Host: ai.zlinfot.com' http://127.0.0.1
```

外部测试（DNS 切换前）：

```bash
curl -I -H 'Host: ai.zlinfot.com' http://101.200.186.149
```

期望返回 `HTTP/1.1 200 OK`。

## 切换 DNS

在阿里云 DNS 中删除或暂停当前记录：

```text
ai  CNAME  custom-domains.chatgpt.site
```

新增：

```text
ai  A  101.200.186.149
```

TTL 建议 600 秒。TXT 验证记录可暂时保留，确认迁移完成后再清理。

## 启用 HTTPS

DNS 生效后执行：

```bash
sudo bash server/enable-https.sh
```

测试：

```bash
curl -I https://ai.zlinfot.com
```

## 回滚

如新服务器异常，将 `ai` 的 A 记录暂停，并恢复原 CNAME：

```text
ai  CNAME  custom-domains.chatgpt.site
```

## 注意

- CentOS 7 已停止官方维护，建议后续迁移至 Alibaba Cloud Linux 3 或 Ubuntu 22.04/24.04 LTS。
- 本包不包含密码、密钥或云账号凭据。
- 如果 `yum` 安装失败，通常是 CentOS 7 软件源过期，需要先切换阿里云归档源。
