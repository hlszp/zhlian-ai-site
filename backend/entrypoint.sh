#!/usr/bin/env bash
set -euo pipefail

# Run Alembic migrations, then start uvicorn.
# DATABASE_URL must be set by the environment.

echo "DATABASE_URL=${DATABASE_URL:-unset}"

alembic upgrade head

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
