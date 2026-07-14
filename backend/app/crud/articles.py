from sqlalchemy.orm import Session
from app.models import Article, Category, Tag
from app.schemas import ArticleCreate, ArticleUpdate, ArticleStatusUpdate
from typing import Optional

# Articles

def get_article(db: Session, article_id: str) -> Optional[Article]:
    return db.query(Article).filter(Article.id == article_id).first()


def get_article_by_slug(db: Session, slug: str) -> Optional[Article]:
    return db.query(Article).filter(Article.slug == slug).first()


def list_articles(
    db: Session,
    status: Optional[str] = None,
    kind: Optional[str] = None,
    industry: Optional[str] = None,
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    query = db.query(Article)
    if status:
        query = query.filter(Article.status == status)
    if kind:
        query = query.filter(Article.kind == kind)
    if industry:
        query = query.filter(Article.industry == industry)
    if q:
        query = query.filter(
            Article.title.ilike(f"%{q}%") | Article.summary.ilike(f"%{q}%")
        )
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return total, items


def create_article(db: Session, article: ArticleCreate) -> Article:
    db_article = Article(**article.model_dump())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article


def update_article(db: Session, article_id: str, article: ArticleUpdate) -> Optional[Article]:
    db_article = db.query(Article).filter(Article.id == article_id).first()
    if not db_article:
        return None
    update_data = article.model_dump(exclude_unset=True)
    update_data.pop("id", None)
    for key, value in update_data.items():
        setattr(db_article, key, value)
    db.commit()
    db.refresh(db_article)
    return db_article


def update_article_status(db: Session, article_id: str, status_update: ArticleStatusUpdate) -> Optional[Article]:
    db_article = db.query(Article).filter(Article.id == article_id).first()
    if not db_article:
        return None
    db_article.status = status_update.status
    db.commit()
    db.refresh(db_article)
    return db_article


def delete_article(db: Session, article_id: str) -> bool:
    db_article = db.query(Article).filter(Article.id == article_id).first()
    if not db_article:
        return False
    db.delete(db_article)
    db.commit()
    return True


# Categories

def list_categories(db: Session) -> list[Category]:
    return db.query(Category).order_by(Category.order).all()


def get_category(db: Session, slug: str) -> Optional[Category]:
    return db.query(Category).filter(Category.slug == slug).first()


def create_category(db: Session, slug: str, name: str, description: str = "", order: int = 0) -> Category:
    db_cat = Category(slug=slug, name=name, description=description, order=order)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat


def upsert_category(db: Session, slug: str, name: str, description: str = "", order: int = 0) -> Category:
    db_cat = db.query(Category).filter(Category.slug == slug).first()
    if db_cat:
        db_cat.name = name
        db_cat.description = description
        db_cat.order = order
    else:
        db_cat = Category(slug=slug, name=name, description=description, order=order)
        db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat


# Tags

def list_tags(db: Session) -> list[Tag]:
    return db.query(Tag).order_by(Tag.name).all()


def get_tag(db: Session, slug: str) -> Optional[Tag]:
    return db.query(Tag).filter(Tag.slug == slug).first()


def create_tag(db: Session, slug: str, name: str) -> Tag:
    db_tag = Tag(slug=slug, name=name)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


def upsert_tag(db: Session, slug: str, name: str) -> Tag:
    db_tag = db.query(Tag).filter(Tag.slug == slug).first()
    if db_tag:
        db_tag.name = name
    else:
        db_tag = Tag(slug=slug, name=name)
        db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag
