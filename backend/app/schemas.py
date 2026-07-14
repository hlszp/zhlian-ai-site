from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# Shared base schemas
class ArticleBase(BaseModel):
    slug: str = Field(..., min_length=1, max_length=255)
    title: str = Field(..., min_length=1, max_length=500)
    kind: str = Field(..., pattern=r"^(case|principle|standard|open-source|vendor)$")
    industry: str = Field(..., min_length=1, max_length=100)
    status: str = Field(default="draft", pattern=r"^(draft|pending_review|published|archived)$")
    summary: str = Field(..., min_length=1)
    body: str = ""
    source_url: str = Field(..., min_length=1)
    source_title: str = Field(..., min_length=1, max_length=500)
    source_org: str = Field(..., min_length=1, max_length=255)
    source_type: str = Field(..., min_length=1, max_length=100)
    tags: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    ai_summary: Optional[str] = None
    ai_collected_at: Optional[datetime] = None


class ArticleCreate(ArticleBase):
    id: str = Field(..., min_length=1, max_length=255)


class ArticleUpdate(BaseModel):
    slug: Optional[str] = Field(default=None, min_length=1, max_length=255)
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    kind: Optional[str] = Field(default=None, pattern=r"^(case|principle|standard|open-source|vendor)$")
    industry: Optional[str] = Field(default=None, min_length=1, max_length=100)
    status: Optional[str] = Field(default=None, pattern=r"^(draft|pending_review|published|archived)$")
    summary: Optional[str] = Field(default=None, min_length=1)
    body: Optional[str] = None
    source_url: Optional[str] = Field(default=None, min_length=1)
    source_title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    source_org: Optional[str] = Field(default=None, min_length=1, max_length=255)
    source_type: Optional[str] = Field(default=None, min_length=1, max_length=100)
    tags: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    ai_summary: Optional[str] = None
    ai_collected_at: Optional[datetime] = None


class ArticleStatusUpdate(BaseModel):
    status: str = Field(..., pattern=r"^(draft|pending_review|published|archived)$")
    reviewed_by: Optional[str] = None


class ArticleOut(ArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class CategoryBase(BaseModel):
    slug: str = Field(..., min_length=1, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    order: int = 0


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, min_length=1)
    order: Optional[int] = None


class CategoryOut(CategoryBase):
    model_config = ConfigDict(from_attributes=True)


class TagBase(BaseModel):
    slug: str = Field(..., min_length=1, max_length=255)
    name: str = Field(..., min_length=1, max_length=255)


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)


class TagOut(TagBase):
    model_config = ConfigDict(from_attributes=True)


class ArticleListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total: int
    items: list[ArticleOut]


class HealthOut(BaseModel):
    status: str
    environment: str
    version: str = "0.1.0"
