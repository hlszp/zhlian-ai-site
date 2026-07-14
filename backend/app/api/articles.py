from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud import articles as articles_crud
from app.database import get_db
from app.schemas import (
    ArticleCreate,
    ArticleListResponse,
    ArticleOut,
    ArticleStatusUpdate,
    ArticleUpdate,
)

router = APIRouter()


@router.get("/articles", response_model=ArticleListResponse)
def read_articles(
    status: Optional[str] = None,
    kind: Optional[str] = None,
    industry: Optional[str] = None,
    q: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    total, items = articles_crud.list_articles(
        db, status=status, kind=kind, industry=industry, q=q, skip=skip, limit=limit
    )
    return ArticleListResponse(total=total, items=items)


@router.post("/articles", response_model=ArticleOut, status_code=status.HTTP_201_CREATED)
def create_article(article: ArticleCreate, db: Session = Depends(get_db)):
    existing_id = articles_crud.get_article(db, article.id)
    if existing_id:
        raise HTTPException(status_code=409, detail="Article with this id already exists")
    existing_slug = articles_crud.get_article_by_slug(db, article.slug)
    if existing_slug:
        raise HTTPException(status_code=409, detail="Article with this slug already exists")
    return articles_crud.create_article(db, article)


@router.get("/articles/{article_id}", response_model=ArticleOut)
def read_article(article_id: str, db: Session = Depends(get_db)):
    db_article = articles_crud.get_article(db, article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    return db_article


@router.put("/articles/{article_id}", response_model=ArticleOut)
def update_article(article_id: str, article: ArticleUpdate, db: Session = Depends(get_db)):
    db_article = articles_crud.get_article(db, article_id)
    if not db_article:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.slug and article.slug != db_article.slug:
        existing = articles_crud.get_article_by_slug(db, article.slug)
        if existing:
            raise HTTPException(status_code=409, detail="Slug already in use")
    updated = articles_crud.update_article(db, article_id, article)
    if not updated:
        raise HTTPException(status_code=404, detail="Article not found")
    return updated


@router.patch("/articles/{article_id}/status", response_model=ArticleOut)
def update_article_status(
    article_id: str, status_update: ArticleStatusUpdate, db: Session = Depends(get_db)
):
    updated = articles_crud.update_article_status(db, article_id, status_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Article not found")
    return updated


@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(article_id: str, db: Session = Depends(get_db)):
    deleted = articles_crud.delete_article(db, article_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Article not found")
    return None
