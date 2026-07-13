# Project Operations

## Project Summary

- Product: ZHILIAN 流程工业 AI 与智能体知识网站
- Public site: `http://ai.zlinfot.com/`
- Stack: React + TypeScript + Vite static build, served by Nginx
- Content source today: `src/App.tsx` and `src/styles.css`
- Planned content source: validated Markdown or structured data under `content/`
- Scope today: knowledge, cases, principles, papers, repositories and vendor references; no login, online inference, payment or admin backend
- `zhilianAI-guid.md`: local project guide only; preserve it, but do not package or deploy it

## Deploy Configuration

- Platform: GitHub Actions over SSH to a self-managed Nginx server
- Production URL: http://ai.zlinfot.com/
- Production workflow: `.github/workflows/deploy.yml`
- CI workflow: `.github/workflows/ci.yml`
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

## CI/CD Procedure

1. Pull Requests and pushes to `main` run CI: `npm ci`, `npm run build`, `bash tests/deploy-scripts.sh`, and `bash scripts/package.sh`.
2. A push to `main` or a manual `workflow_dispatch` starts `Deploy production`. Its `build` Job has no production Environment or secrets and uploads the verified release Artifact.
3. The dependent `deploy` Job enters the `production` Environment, downloads the Artifact, validates its filename and SHA-256, then connects with the dedicated SSH key and verified host key.
4. The server-side command is `DEPLOY_LOCK_MODE=flock bash server/deploy.sh --app-root /opt/zlinfot-ai --release-id <id> --static-only`. It runs as `zhilian-deploy`, atomically updates `current`, performs a local HTTP health check, and leaves the old release at `previous`.
5. The workflow performs the public HTTP check, recovers the attempted release if necessary, removes the remote upload, and deletes temporary SSH material from the Runner.

Normal content changes therefore follow: `PR → CI → merge to main → Deploy production → public health check`. Do not SSH into the server for routine publishing. Do not change DNS, TLS, firewall, or Nginx as part of a normal release.

## Operations Notes

- Keep `PROD_SSH_KEY` and `PROD_KNOWN_HOSTS` only in the GitHub `production` Environment.
- The server deploy user has no password and no sudo permission; root access is reserved for infrastructure maintenance.
- Keep at least the current and previous release until the new release has passed public verification.
- The repository uses HTTP today. Updating `PROD_URL` to HTTPS requires a separately approved TLS change.
