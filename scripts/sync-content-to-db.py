#!/usr/bin/env python3
"""Wrapper script to sync content/ Markdown files into the database."""
import argparse
import json
import sys
from pathlib import Path

# Ensure backend/app is on the path
ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal, engine, Base
from app.services.sync import sync_all
from app.config import get_settings


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync content/ files into the database")
    parser.add_argument(
        "--content-dir",
        type=Path,
        default=ROOT / "content",
        help="Path to content directory (default: ../content)",
    )
    parser.add_argument(
        "--database-url",
        type=str,
        default=None,
        help="Override DATABASE_URL",
    )
    args = parser.parse_args()

    if args.database_url:
        import os
        os.environ["DATABASE_URL"] = args.database_url

    settings = get_settings()
    print(f"Using database: {settings.database_url}", file=sys.stderr)
    print(f"Syncing content from: {args.content_dir}", file=sys.stderr)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        result = sync_all(db, args.content_dir)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
