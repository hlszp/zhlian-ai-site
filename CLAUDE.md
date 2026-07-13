# Project Operations

## Deploy Configuration

- Platform: GitHub Actions over SSH to a self-managed Nginx server
- Production URL: http://ai.zlinfot.com/
- Production workflow: `.github/workflows/deploy.yml`
- Production branch: `main`
- GitHub environment: `production`
- Server app root: `/opt/zlinfot-ai`
- Server upload root: `/var/tmp/zhilian-deploy`
- Deploy user: `zhilian-deploy` (no sudo)
- Release command: `bash server/deploy.sh --app-root /opt/zlinfot-ai --release-id <id> --static-only`
- Rollback command: `bash server/rollback.sh --app-root /opt/zlinfot-ai --static-only`
- Health checks: server loopback check during atomic switch, then public `PROD_URL` from GitHub Actions
- Secrets: GitHub `production` Environment only; never store SSH private keys or host keys in the repository
- Infrastructure boundary: normal releases do not modify or reload Nginx, DNS, firewall, or TLS

GitHub Environment variables are `PROD_HOST`, `PROD_PORT`, `PROD_USER`, `PROD_URL`, and `PROD_UPLOAD_DIR`. Secrets are `PROD_SSH_KEY` and `PROD_KNOWN_HOSTS`. Production deploys run serially with `cancel-in-progress: false`.
