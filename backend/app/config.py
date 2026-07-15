from functools import lru_cache
import os
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator


class Settings(BaseModel):
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

    @model_validator(mode="after")
    def reject_insecure_production_defaults(self) -> "Settings":
        if not self.database_url:
            self.database_url = (
                f"postgresql://{self.database_user}:{self.database_password}"
                f"@{self.database_host}:{self.database_port}/{self.database_name}"
            )
        if self.environment.lower() == "production":
            if self.admin_password == "admin" or len(self.admin_password) < 12:
                raise ValueError(
                    "ADMIN_PASSWORD must be changed and contain at least 12 characters in production"
                )
            if "zlai:zlai@" in str(self.database_url):
                raise ValueError("DATABASE_URL must not use the development credentials in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "zhilianAI-site Backend"),
        debug=os.getenv("DEBUG", "false").lower() in {"1", "true", "yes", "on"},
        environment=os.getenv("ENVIRONMENT", "development"),
        database_url=os.getenv("DATABASE_URL"),
        database_host=os.getenv("DATABASE_HOST", "localhost"),
        database_port=int(os.getenv("DATABASE_PORT", "5432")),
        database_user=os.getenv("DATABASE_USER", "zlai"),
        database_password=os.getenv("DATABASE_PASSWORD", "zlai"),
        database_name=os.getenv("DATABASE_NAME", "zlai"),
        cors_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173"),
        api_prefix=os.getenv("API_PREFIX", "/api"),
        admin_username=os.getenv("ADMIN_USERNAME", "admin"),
        admin_password=os.getenv("ADMIN_PASSWORD", "admin"),
    )
