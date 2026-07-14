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
from app.crud.articles import (
    create_article,
    get_article,
    get_article_by_slug,
    list_articles,
    update_article,
    update_article_status,
    delete_article,
    upsert_category,
    upsert_tag,
)
from app.schemas import ArticleCreate, ArticleUpdate, ArticleStatusUpdate

SQLITE_DATABASE_URL = "sqlite:///./test_crud.db"
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


def sample_article_create():
    return ArticleCreate(
        id="crud-1",
        slug="crud-article",
        title="CRUD Article",
        kind="principle",
        industry="general",
        status="draft",
        summary="Summary",
        body="Body",
        source_url="https://example.com/source",
        source_title="Source",
        source_org="Org",
        source_type="blog",
        tags=["t1"],
        categories=["c1"],
    )


def test_create_and_get_article(db):
    article = create_article(db, sample_article_create())
    fetched = get_article(db, article.id)
    assert fetched is not None
    assert fetched.title == "CRUD Article"


def test_get_article_by_slug(db):
    article = create_article(db, sample_article_create())
    fetched = get_article_by_slug(db, article.slug)
    assert fetched is not None
    assert fetched.id == article.id


def test_list_articles(db):
    create_article(db, sample_article_create())
    total, items = list_articles(db)
    assert total == 1
    assert len(items) == 1


def test_update_article(db):
    article = create_article(db, sample_article_create())
    updated = update_article(db, article.id, ArticleUpdate(title="Updated"))
    assert updated is not None
    assert updated.title == "Updated"


def test_update_article_status(db):
    article = create_article(db, sample_article_create())
    updated = update_article_status(db, article.id, ArticleStatusUpdate(status="published"))
    assert updated is not None
    assert updated.status == "published"


def test_delete_article(db):
    article = create_article(db, sample_article_create())
    deleted = delete_article(db, article.id)
    assert deleted is True
    assert get_article(db, article.id) is None


def test_upsert_category(db):
    cat = upsert_category(db, slug="cat-a", name="Category A", description="Desc", order=1)
    assert cat.slug == "cat-a"
    assert cat.name == "Category A"
    cat2 = upsert_category(db, slug="cat-a", name="Category A Updated", description="Desc", order=1)
    assert cat2.name == "Category A Updated"


def test_upsert_tag(db):
    tag = upsert_tag(db, slug="tag-a", name="Tag A")
    assert tag.slug == "tag-a"
    tag2 = upsert_tag(db, slug="tag-a", name="Tag A Updated")
    assert tag2.name == "Tag A Updated"
