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

    # Import database state only after applying the CLI override; app.database
    # creates its engine at module import time.
    from app.config import get_settings
    from app.database import Base, SessionLocal, engine
    from app.services.sync import sync_all

    settings = get_settings()
    print("Using configured database connection", file=sys.stderr)
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
