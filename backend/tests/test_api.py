import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

SQLITE_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLITE_DATABASE_URL,
    connect_args={"check_same_thread": False},
    future=True,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
ADMIN_AUTH = ("admin", "admin")


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_article():
    return {
        "id": "test-article-1",
        "slug": "test-article",
        "title": "Test Article",
        "kind": "case",
        "industry": "pharma",
        "status": "draft",
        "summary": "A test summary",
        "body": "Body text",
        "source_url": "https://example.com/source",
        "source_title": "Source Title",
        "source_org": "Example Org",
        "source_type": "blog",
        "tags": ["tag-a"],
        "categories": ["cat-a"],
    }


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"
    assert data["environment"] == "development"


def test_create_article(client, sample_article):
    r = client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    assert r.status_code == 201
    data = r.json()
    assert data["id"] == sample_article["id"]
    assert data["slug"] == sample_article["slug"]


def test_create_article_duplicate_id(client, sample_article):
    client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    r = client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    assert r.status_code == 409


def test_get_article(client, sample_article):
    client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    r = client.get(f"/api/articles/{sample_article['id']}", auth=ADMIN_AUTH)
    assert r.status_code == 200
    data = r.json()
    assert data["title"] == sample_article["title"]


def test_get_article_not_found(client):
    r = client.get("/api/articles/nonexistent", auth=ADMIN_AUTH)
    assert r.status_code == 404


def test_list_articles(client, sample_article):
    client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    r = client.get("/api/articles", auth=ADMIN_AUTH)
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert len(data["items"]) == 1


def test_list_articles_filter(client, sample_article):
    client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    r = client.get("/api/articles?status=draft", auth=ADMIN_AUTH)
    assert r.status_code == 200
    assert r.json()["total"] == 1

    r = client.get("/api/articles?status=published", auth=ADMIN_AUTH)
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_list_articles_search(client, sample_article):
    client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    r = client.get("/api/articles?q=Test", auth=ADMIN_AUTH)
    assert r.status_code == 200
    assert r.json()["total"] == 1

    r = client.get("/api/articles?q=nonexistent", auth=ADMIN_AUTH)
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_update_article(client, sample_article):
    client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    updated = {**sample_article, "title": "Updated Title"}
    r = client.put(f"/api/articles/{sample_article['id']}", json=updated, auth=ADMIN_AUTH)
    assert r.status_code == 200
    assert r.json()["title"] == "Updated Title"


def test_update_article_status(client, sample_article):
    client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    r = client.patch(
        f"/api/articles/{sample_article['id']}/status",
        json={"status": "published"},
        auth=ADMIN_AUTH,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "published"


def test_delete_article(client, sample_article):
    client.post("/api/articles", json=sample_article, auth=ADMIN_AUTH)
    r = client.delete(f"/api/articles/{sample_article['id']}", auth=ADMIN_AUTH)
    assert r.status_code == 204
    r = client.get(f"/api/articles/{sample_article['id']}", auth=ADMIN_AUTH)
    assert r.status_code == 404


def test_categories_empty(client):
    r = client.get("/api/categories", auth=ADMIN_AUTH)
    assert r.status_code == 200
    assert r.json() == []


def test_tags_empty(client):
    r = client.get("/api/tags", auth=ADMIN_AUTH)
    assert r.status_code == 200
    assert r.json() == []


@pytest.mark.parametrize(
    ("method", "path", "json"),
    [
        ("get", "/api/articles", None),
        ("post", "/api/articles", {}),
        ("get", "/api/categories", None),
        ("post", "/api/categories", {}),
        ("get", "/api/tags", None),
        ("post", "/api/tags", {}),
    ],
)
def test_management_api_requires_authentication(client, method, path, json):
    response = client.request(method, path, json=json)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Basic"


def test_management_api_rejects_invalid_credentials(client):
    response = client.get("/api/articles", auth=("admin", "wrong-password"))
    assert response.status_code == 401
