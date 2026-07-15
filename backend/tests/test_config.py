import pytest
from pydantic import ValidationError

from app.config import Settings, get_settings


def test_production_rejects_default_admin_password():
    with pytest.raises(ValidationError, match="ADMIN_PASSWORD"):
        Settings(environment="production", database_url="postgresql://user:strong@db/app")


def test_production_rejects_default_database_credentials():
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(
            environment="production",
            admin_password="a-strong-password",
            database_url="postgresql://zlai:zlai@localhost/zlai",
        )


def test_production_accepts_explicit_secrets():
    settings = Settings(
        environment="production",
        database_url="postgresql://app:strong-password@db/app",
        admin_username="editor",
        admin_password="another-strong-password",
    )
    assert settings.environment == "production"


def test_get_settings_reads_process_environment(monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "environment-editor")
    monkeypatch.setenv("CORS_ORIGINS", "https://one.example,https://two.example")
    get_settings.cache_clear()
    try:
        settings = get_settings()
        assert settings.admin_username == "environment-editor"
        assert settings.cors_origins == ["https://one.example", "https://two.example"]
    finally:
        get_settings.cache_clear()
