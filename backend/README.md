# Backend

Phase 2 will introduce a FastAPI + PostgreSQL backend for content management, to support:

- REST API for articles, categories, tags, and sources
- Content review workflow (draft → pending_review → published → archived)
- Webhook endpoint for Hermes agent-collected content
- Independent admin dashboard deployment

Planned structure:
- `app/main.py` FastAPI entrypoint
- `app/models.py` SQLAlchemy models
- `app/schemas.py` Pydantic schemas
- `app/api/` REST endpoints
- `app/services/` business logic
- `app/core/config.py` settings
- `migrations/` Alembic migrations
- `tests/` pytest suite
- `Dockerfile`
- `pyproject.toml`

This directory is intentionally empty in Phase 1 to keep the project boundary clean.
