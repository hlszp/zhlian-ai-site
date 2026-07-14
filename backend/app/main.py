from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import articles, categories, tags
from app.config import get_settings
from app.schemas import HealthOut

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="REST API for managing articles, categories, and tags.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(articles.router, prefix=settings.api_prefix)
app.include_router(categories.router, prefix=settings.api_prefix)
app.include_router(tags.router, prefix=settings.api_prefix)


@app.get("/health", response_model=HealthOut, tags=["health"])
async def health_check() -> HealthOut:
    return HealthOut(status="ok", environment=settings.environment)
