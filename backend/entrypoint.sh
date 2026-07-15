#!/usr/bin/env bash
set -euo pipefail

# Run Alembic migrations, then start uvicorn.
# DATABASE_URL must be set by the environment.

[[ -n "${DATABASE_URL:-}" ]] || { echo "DATABASE_URL is required" >&2; exit 1; }

alembic upgrade head

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
