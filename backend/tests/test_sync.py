import os
import subprocess
import sys
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend/app is importable
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import Base
from app.services.sync import sync_all
from app.crud.articles import get_article, list_categories, list_tags

SQLITE_DATABASE_URL = "sqlite:///./test_sync.db"
engine = create_engine(
    SQLITE_DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_sync_all(db, tmp_path):
    # Create a minimal content tree
    content_dir = tmp_path / "content"
    articles_dir = content_dir / "articles" / "cases"
    articles_dir.mkdir(parents=True)

    (content_dir / "categories.json").write_text(
        '[{"slug": "cat-a", "name": "Category A", "description": "Desc", "order": 1}]',
        encoding="utf-8",
    )
    (content_dir / "tags.json").write_text(
        '[{"slug": "tag-a", "name": "Tag A"}]',
        encoding="utf-8",
    )
    (articles_dir / "article-one.md").write_text(
        "---\n"
        "id: sync-1\n"
        "slug: sync-article-one\n"
        "title: Sync Article One\n"
        "kind: case\n"
        "industry: pharma\n"
        "status: published\n"
        "summary: Test summary\n"
        "source_url: https://example.com/one\n"
        "source_title: One\n"
        "source_org: Org\n"
        "source_type: blog\n"
        "tags:\n  - tag-a\n"
        "categories:\n  - cat-a\n"
        "created_at: 2026-07-13T00:00:00Z\n"
        "updated_at: 2026-07-13T00:00:00Z\n"
        "---\n\nBody content\n",
        encoding="utf-8",
    )

    result = sync_all(db, content_dir)
    assert result["categories"] == 1
    assert result["tags"] == 1
    assert result["articles_created"] == 1
    assert result["articles_updated"] == 0

    # Idempotency: second run should update, not create
    result2 = sync_all(db, content_dir)
    assert result2["articles_created"] == 0
    assert result2["articles_updated"] == 1

    article = get_article(db, "sync-1")
    assert article is not None
    assert article.title == "Sync Article One"
    assert article.body == "Body content"
    assert list_categories(db)[0].name == "Category A"
    assert list_tags(db)[0].name == "Tag A"


def test_sync_cli_database_url_overrides_environment(tmp_path):
    content_dir = tmp_path / "content"
    articles_dir = content_dir / "articles" / "cases"
    articles_dir.mkdir(parents=True)
    (content_dir / "categories.json").write_text("[]", encoding="utf-8")
    (content_dir / "tags.json").write_text("[]", encoding="utf-8")
    (articles_dir / "article.md").write_text(
        "---\n"
        "id: cli-sync-1\nslug: cli-sync-1\ntitle: CLI Sync\nkind: case\n"
        "industry: pharma\nstatus: published\nsummary: CLI override test\n"
        "source_url: https://example.com/cli\nsource_title: CLI\nsource_org: Test\n"
        "source_type: blog\ntags: []\ncategories: []\n"
        "created_at: 2026-07-15T00:00:00Z\nupdated_at: 2026-07-15T00:00:00Z\n"
        "---\n\nBody\n",
        encoding="utf-8",
    )

    repository_root = BACKEND_DIR.parent
    environment_db = tmp_path / "environment.db"
    override_db = tmp_path / "override.db"
    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite:///{environment_db}"
    result = subprocess.run(
        [
            sys.executable,
            str(repository_root / "scripts" / "sync-content-to-db.py"),
            "--content-dir",
            str(content_dir),
            "--database-url",
            f"sqlite:///{override_db}",
        ],
        cwd=repository_root,
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    assert override_db.exists()
    assert not environment_db.exists()
