"""One-way sync: content/ Markdown files + JSON manifests → database.

Idempotent by article id and slug; updates existing rows, inserts missing rows.
Categories and tags are upserted from their JSON manifests.
"""
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy.orm import Session

from app.crud.articles import (
    get_article,
    create_article,
    update_article,
    upsert_category,
    upsert_tag,
)
from app.models import Article
from app.schemas import ArticleCreate, ArticleUpdate


ARTICLES_DIR = "articles"
CATEGORIES_FILE = "categories.json"
TAGS_FILE = "tags.json"


def parse_frontmatter(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path}: missing frontmatter")
    parts = text.split("---", 2)
    if len(parts) < 3:
        raise ValueError(f"{path}: invalid frontmatter")
    fm = yaml.safe_load(parts[1])
    if not isinstance(fm, dict):
        raise ValueError(f"{path}: frontmatter is not a mapping")
    body = parts[2].strip()
    fm["body"] = body
    return fm


def normalize_timestamp(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        # Handle trailing Z
        value = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return None
    return None


def article_from_frontmatter(path: Path) -> dict[str, Any]:
    fm = parse_frontmatter(path)
    required = {"id", "slug", "title", "kind", "industry", "status", "summary", "source_url", "source_title", "source_org", "source_type"}
    missing = required - set(fm.keys())
    if missing:
        raise ValueError(f"{path}: missing fields {sorted(missing)}")

    return {
        "id": str(fm["id"]),
        "slug": str(fm["slug"]),
        "title": str(fm["title"]),
        "kind": str(fm["kind"]),
        "industry": str(fm["industry"]),
        "status": str(fm["status"]),
        "summary": str(fm["summary"]),
        "body": str(fm.get("body", "")),
        "source_url": str(fm["source_url"]),
        "source_title": str(fm["source_title"]),
        "source_org": str(fm["source_org"]),
        "source_type": str(fm["source_type"]),
        "tags": list(fm.get("tags") or []),
        "categories": list(fm.get("categories") or []),
        "reviewed_by": fm.get("reviewed_by"),
        "reviewed_at": normalize_timestamp(fm.get("reviewed_at")),
        "ai_summary": fm.get("ai_summary"),
        "ai_collected_at": normalize_timestamp(fm.get("ai_collected_at")),
    }


def load_categories(content_dir: Path) -> list[dict[str, Any]]:
    path = content_dir / CATEGORIES_FILE
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []


def load_tags(content_dir: Path) -> list[dict[str, Any]]:
    path = content_dir / TAGS_FILE
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else []


def sync_manifests(db: Session, content_dir: Path) -> tuple[int, int]:
    categories = load_categories(content_dir)
    tags = load_tags(content_dir)
    for cat in categories:
        upsert_category(
            db,
            slug=cat["slug"],
            name=cat["name"],
            description=cat.get("description", ""),
            order=cat.get("order", 0),
        )
    for tag in tags:
        upsert_tag(db, slug=tag["slug"], name=tag["name"])
    return len(categories), len(tags)


def sync_articles(db: Session, content_dir: Path) -> tuple[int, int]:
    articles_dir = content_dir / ARTICLES_DIR
    if not articles_dir.exists():
        return 0, 0

    created = 0
    updated = 0
    for path in sorted(articles_dir.rglob("*.md")):
        data = article_from_frontmatter(path)
        existing = get_article(db, data["id"])
        if existing:
            # Idempotent update: only update fields present in the file, keep DB-only fields if not provided
            update_article(db, data["id"], ArticleUpdate(**data))
            updated += 1
        else:
            create_article(db, ArticleCreate(**data))
            created += 1
    return created, updated


def sync_all(db: Session, content_dir: Path | str) -> dict[str, int]:
    content_dir = Path(content_dir)
    cat_count, tag_count = sync_manifests(db, content_dir)
    created, updated = sync_articles(db, content_dir)
    return {
        "categories": cat_count,
        "tags": tag_count,
        "articles_created": created,
        "articles_updated": updated,
        "articles_total": created + updated,
    }


if __name__ == "__main__":
    import sys
    from app.database import SessionLocal, engine, Base

    Base.metadata.create_all(bind=engine)
    content_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[3] / "content"
    db = SessionLocal()
    try:
        result = sync_all(db, content_dir)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    finally:
        db.close()
