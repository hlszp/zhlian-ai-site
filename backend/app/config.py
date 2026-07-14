from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "zhilianAI-site Backend"
    debug: bool = Field(default=False)
    environment: str = Field(default="development")

    database_url: str | None = None
    database_host: str = "localhost"
    database_port: int = 5432
    database_user: str = "zlai"
    database_password: str = "zlai"
    database_name: str = "zlai"

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    api_prefix: str = "/api"
    admin_username: str = "admin"
    admin_password: str = "admin"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def build_database_url(cls, value: Any, info: Any) -> Any:
        if value:
            return value
        data = info.data
        host = data.get("database_host", "localhost")
        port = data.get("database_port", 5432)
        user = data.get("database_user", "zlai")
        password = data.get("database_password", "zlai")
        name = data.get("database_name", "zlai")
        return f"postgresql://{user}:{password}@{host}:{port}/{name}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
