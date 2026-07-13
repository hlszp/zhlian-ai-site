#!/usr/bin/env python3
"""Validate content files against the content model."""
import json
import re
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
ARTICLES_DIR = CONTENT_DIR / "articles"

REQUIRED_FIELDS = {
    "id", "title", "kind", "industry", "status", "summary",
    "source_url", "source_title", "source_org", "source_type",
    "created_at", "updated_at",
}
OPTIONAL_FIELDS = {
    "body", "tags", "categories", "reviewed_by", "reviewed_at",
    "ai_summary", "ai_collected_at",
}
KNOWN_FIELDS = REQUIRED_FIELDS | OPTIONAL_FIELDS

VALID_KINDS = {"case", "principle", "standard", "open-source", "vendor"}
VALID_INDUSTRIES = {
    "general", "chemical", "metallurgy", "building-material", "pharma",
    "agrochemical", "coating", "electronic-chemical",
}
VALID_STATUSES = {"draft", "pending_review", "published", "archived"}
VALID_SOURCE_TYPES = {"standard", "paper", "blog", "repo", "vendor", "other"}


URL_RE = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)
ISO8601_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$"
)


def parse_frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError("missing frontmatter")
    parts = text.split("---", 2)
    if len(parts) < 3:
        raise ValueError("invalid frontmatter")
    import yaml

    return yaml.safe_load(parts[1])


def validate_iso(value, field: str) -> list[str]:
    # YAML may auto-parse ISO timestamps into datetime objects.
    if isinstance(value, datetime):
        value = value.isoformat()
    if not isinstance(value, str) or not ISO8601_RE.match(value):
        return [f"invalid {field} timestamp: {value!r}"]
    return []


def validate_article(path: Path, categories: set, tags: set) -> list[str]:
    errors = []
    try:
        fm = parse_frontmatter(path)
    except Exception as exc:
        return [f"{path}: {exc}"]

    if not isinstance(fm, dict):
        return [f"{path}: frontmatter is not a mapping"]

    missing = REQUIRED_FIELDS - set(fm.keys())
    if missing:
        errors.append(f"{path}: missing fields {sorted(missing)}")

    unknown = set(fm.keys()) - KNOWN_FIELDS
    if unknown:
        errors.append(f"{path}: unknown fields {sorted(unknown)}")

    # String required fields
    for field in ("id", "title", "summary", "source_title", "source_org"):
        if field in fm and not isinstance(fm[field], str):
            errors.append(f"{path}: {field} must be a string")

    # Enum fields
    if "kind" in fm and fm["kind"] not in VALID_KINDS:
        errors.append(f"{path}: invalid kind {fm['kind']!r}")
    if "industry" in fm and fm["industry"] not in VALID_INDUSTRIES:
        errors.append(f"{path}: invalid industry {fm['industry']!r}")
    if "status" in fm and fm["status"] not in VALID_STATUSES:
        errors.append(f"{path}: invalid status {fm['status']!r}")
    if "source_type" in fm and fm["source_type"] not in VALID_SOURCE_TYPES:
        errors.append(f"{path}: invalid source_type {fm['source_type']!r}")

    # Source URL format
    source_url = fm.get("source_url", "")
    if not isinstance(source_url, str) or not URL_RE.match(source_url):
        errors.append(f"{path}: invalid source_url {source_url!r}")

    # Timestamps
    for field in ("created_at", "updated_at"):
        if field in fm:
            errors.extend(f"{path}: {e}" for e in validate_iso(fm[field], field))
    for field in ("reviewed_at", "ai_collected_at"):
        if field in fm and fm[field] is not None:
            errors.extend(f"{path}: {e}" for e in validate_iso(fm[field], field))

    # Array references
    for field, reference, label in (
        ("categories", categories, "category"),
        ("tags", tags, "tag"),
    ):
        values = fm.get(field)
        if values is None:
            continue
        if not isinstance(values, list):
            errors.append(f"{path}: {field} must be a list")
            continue
        for item in values:
            if not isinstance(item, str):
                errors.append(f"{path}: {field} must contain strings")
                break
            if item not in reference:
                errors.append(f"{path}: unknown {label} {item!r}")

    return errors


def load_json(path: Path) -> list:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, FileNotFoundError) as exc:
        print(f"Error reading {path}: {exc}", file=sys.stderr)
        sys.exit(1)
    if not isinstance(data, list):
        print(f"Error: {path} must contain a JSON array", file=sys.stderr)
        sys.exit(1)
    return data


def main() -> int:
    categories = {c["slug"] for c in load_json(CONTENT_DIR / "categories.json")}
    tags = {t["slug"] for t in load_json(CONTENT_DIR / "tags.json")}

    if not ARTICLES_DIR.exists():
        print("Validation failed: no articles directory", file=sys.stderr)
        return 1

    errors = []
    for path in sorted(ARTICLES_DIR.rglob("*.md")):
        errors.extend(validate_article(path, categories, tags))

    if errors:
        print("Validation failed:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    count = len(list(ARTICLES_DIR.rglob("*.md")))
    print(f"Validation passed: {count} articles")
    return 0


if __name__ == "__main__":
    sys.exit(main())
