from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.crud import articles as articles_crud
from app.schemas import CategoryCreate, CategoryOut, CategoryUpdate
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/categories", response_model=list[CategoryOut])
def read_categories(db: Session = Depends(get_db)):
    return articles_crud.list_categories(db)


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    existing = articles_crud.get_category(db, category.slug)
    if existing:
        raise HTTPException(status_code=409, detail="Category with this slug already exists")
    return articles_crud.create_category(
        db, category.slug, category.name, category.description, category.order
    )


@router.get("/categories/{slug}", response_model=CategoryOut)
def read_category(slug: str, db: Session = Depends(get_db)):
    db_category = articles_crud.get_category(db, slug)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category


@router.put("/categories/{slug}", response_model=CategoryOut)
def update_category(slug: str, category: CategoryUpdate, db: Session = Depends(get_db)):
    db_category = articles_crud.get_category(db, slug)
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    update_data = category.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category
