# Backend

Phase 2 introduces a FastAPI + PostgreSQL backend for content management, supporting:

- REST API for articles, categories, tags, and sources
- Content review workflow (draft → pending_review → published → archived)
- HTTP Basic authentication for every management API route
- Independent admin dashboard staging

Current structure:
- `app/main.py` FastAPI entrypoint
- `app/models.py` SQLAlchemy models
- `app/schemas.py` Pydantic schemas
- `app/api/` REST endpoints
- `app/services/` business logic
- `app/config.py` settings and production credential validation
- `app/auth.py` HTTP Basic management-route authentication
- `alembic/` database migrations
- `tests/` pytest suite
- `Dockerfile`
- `pyproject.toml`

## Local verification

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
DATABASE_URL=sqlite:///./test.db .venv/bin/python -m pytest -q
```

The backend is not part of the current production release. Before enabling it, provision the systemd `EnvironmentFile` with a non-default `DATABASE_URL` and `ADMIN_PASSWORD` (minimum 12 characters), enable HTTPS, create the service account and database, then validate backend rollback on staging. The application reads process environment variables directly and does not parse local `.env` files. `GET /api/health` is public; all article, category, and tag routes require Basic Auth.
