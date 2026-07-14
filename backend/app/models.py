from typing import Optional
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, validates

from app.database import Base


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    kind: Mapped[str] = mapped_column(String, nullable=False, index=True)
    industry: Mapped[str] = mapped_column(String, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="draft", index=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, default="")
    source_url: Mapped[str] = mapped_column(String, nullable=False)
    source_title: Mapped[str] = mapped_column(String, nullable=False)
    source_org: Mapped[str] = mapped_column(String, nullable=False)
    source_type: Mapped[str] = mapped_column(String, nullable=False)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    categories: Mapped[list] = mapped_column(JSON, default=list)
    reviewed_by: Mapped[str | None] = mapped_column(String, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=now_utc)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=now_utc, onupdate=now_utc)
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_collected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        # Composite index for common list filters
        {"sqlite_autoincrement": False},
    )

    @validates("status")
    def validate_status(self, key: str, value: str) -> str:
        allowed = {"draft", "pending_review", "published", "archived"}
        if value not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return value

    @validates("kind")
    def validate_kind(self, key: str, value: str) -> str:
        allowed = {"case", "principle", "standard", "open-source", "vendor"}
        if value not in allowed:
            raise ValueError(f"kind must be one of {allowed}")
        return value

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Article id={self.id} slug={self.slug} title={self.title}>"


class Category(Base):
    __tablename__ = "categories"

    slug: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Category slug={self.slug} name={self.name}>"


class Tag(Base):
    __tablename__ = "tags"

    slug: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Tag slug={self.slug} name={self.name}>"


if __name__ == "__main__":
    # Import-only smoke test
    print("models.py imported successfully")
