# AGENTS.md

## Project

致联信息“流程工业 AI 与智能体”知识门户。正式域名为 `ai.zlinfot.com`。

## Stack

- React + TypeScript + Vite
- Validated Markdown/JSON content pipeline
- FastAPI + PostgreSQL Phase 2 backend (staging only)
- Static production output
- Nginx on Alibaba Cloud

## Required workflow

1. Read `README.md` before changing deployment behavior.
2. Keep source changes in `frontend/src/`, `content/`, and `backend/`; never edit generated `dist/` or `site/` files.
3. Run the relevant frontend build, content validation, and backend tests after code changes.
4. Run `bash scripts/package.sh` before a release.
5. Keep desktop and mobile layouts working.
6. Preserve a rollback path for every deployment change.
7. Keep production releases static-only until Phase 2 backend infrastructure and HTTPS are explicitly approved.

## Content rules

- Prefer standards bodies, original papers, official repositories, and vendor sources.
- Do not describe a proposed use case as a proven production deployment.
- Every new external resource must have a clear title, category, summary, and source URL.
- Keep Chinese terminology consistent with the existing site.

## Security

- Never commit passwords, SSH private keys, API keys, AccessKeys, certificates, or tokens.
- Never place secrets in prompts, documentation, shell scripts, or deployment archives.
- Production deployment and DNS changes require explicit human approval.
- Do not modify firewall, SSH, DNS, or TLS settings without a rollback plan.

## Deployment target

- Host: configured outside the repository
- OS: CentOS 7.9 currently; migration to Alibaba Cloud Linux 3 or Ubuntu LTS is recommended
- Application root: `/opt/zlinfot-ai`
- Active web root: `/opt/zlinfot-ai/current/site`
- Nginx config: `/etc/nginx/conf.d/ai.zlinfot.com.conf`
