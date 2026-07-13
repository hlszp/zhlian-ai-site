#!/usr/bin/env python3
"""Build site-data.json from content/."""
import json
from pathlib import Path
from datetime import datetime, timezone


def normalize_value(value):
    """Ensure YAML-parsed datetime objects become ISO strings."""
    if isinstance(value, datetime):
        return value.isoformat().replace("+00:00", "Z")
    if isinstance(value, list):
        return [normalize_value(v) for v in value]
    if isinstance(value, dict):
        return {k: normalize_value(v) for k, v in value.items()}
    return value


ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
ARTICLES_DIR = CONTENT_DIR / "articles"
OUTPUT = ROOT / "frontend" / "public" / "site-data.json"


def load_json(path: Path) -> list:
    if not path.exists():
        print(f"Warning: {path} not found, using empty list", file=__import__("sys").stderr)
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def parse_article(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path}: missing frontmatter")
    parts = text.split("---", 2)
    if len(parts) < 3:
        raise ValueError(f"{path}: invalid frontmatter")
    import yaml

    frontmatter = yaml.safe_load(parts[1])
    if not isinstance(frontmatter, dict):
        raise ValueError(f"{path}: frontmatter is not a mapping")
    body = parts[2].strip()
    frontmatter = normalize_value(frontmatter)
    if not isinstance(frontmatter, dict):
        raise ValueError(f"{path}: frontmatter is not a mapping")
    frontmatter["body"] = body
    return frontmatter


def sort_key(article: dict) -> str:
    # Deterministic ordering by created_at desc, then id asc
    created = article.get("created_at", "")
    return f"{created}\t{article.get('id', '')}"


def main() -> None:
    categories = load_json(CONTENT_DIR / "categories.json")
    tags = load_json(CONTENT_DIR / "tags.json")

    articles = []
    if ARTICLES_DIR.exists():
        for path in sorted(ARTICLES_DIR.rglob("*.md")):
            articles.append(parse_article(path))

    articles.sort(key=sort_key, reverse=True)

    published = [a for a in articles if a.get("status") == "published"]
    drafts = [a for a in articles if a.get("status") != "published"]

    data = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "version": "1.0.0",
        },
        "categories": categories,
        "tags": tags,
        "articles": published,
        "drafts": drafts,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, sort_keys=False) + "\n",
        encoding="utf-8",
    )
    print(
        f"Generated {OUTPUT} with {len(published)} published articles "
        f"and {len(drafts)} drafts"
    )


if __name__ == "__main__":
    main()
