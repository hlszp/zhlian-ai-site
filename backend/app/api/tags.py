from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud import articles as articles_crud
from app.schemas import TagCreate, TagOut, TagUpdate

router = APIRouter()


@router.get("/tags", response_model=list[TagOut])
def read_tags(db: Session = Depends(get_db)):
    return articles_crud.list_tags(db)


@router.post("/tags", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    existing = articles_crud.get_tag(db, tag.slug)
    if existing:
        raise HTTPException(status_code=409, detail="Tag with this slug already exists")
    return articles_crud.create_tag(db, tag.slug, tag.name)


@router.get("/tags/{slug}", response_model=TagOut)
def read_tag(slug: str, db: Session = Depends(get_db)):
    db_tag = articles_crud.get_tag(db, slug)
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return db_tag


@router.put("/tags/{slug}", response_model=TagOut)
def update_tag(slug: str, tag: TagUpdate, db: Session = Depends(get_db)):
    db_tag = articles_crud.get_tag(db, slug)
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    update_data = tag.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tag, key, value)
    db.commit()
    db.refresh(db_tag)
    return db_tag
