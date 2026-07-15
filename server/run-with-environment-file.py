#!/usr/bin/env python3
"""Execute a command with a strictly parsed, trusted systemd-style EnvironmentFile."""

from __future__ import annotations

import os
from pathlib import Path
import re
import shlex
import stat
import sys


KEY_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
REQUIRED_KEYS = ("DATABASE_URL", "ADMIN_USERNAME", "ADMIN_PASSWORD")


def load_environment(path: Path) -> dict[str, str]:
    file_stat = path.stat()
    if file_stat.st_uid not in {0, os.geteuid()}:
        raise ValueError("environment file must be owned by root or the current user")
    if stat.S_IMODE(file_stat.st_mode) & 0o022:
        raise ValueError("environment file must not be group- or world-writable")

    values: dict[str, str] = {}
    for line_number, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        key, separator, raw_value = line.partition("=")
        key = key.strip()
        if not separator or not KEY_PATTERN.fullmatch(key):
            raise ValueError(f"invalid environment assignment on line {line_number}")
        parsed = shlex.split(raw_value.strip(), comments=False, posix=True)
        if len(parsed) != 1:
            raise ValueError(f"environment value on line {line_number} must be one token")
        values[key] = parsed[0]

    missing = [key for key in REQUIRED_KEYS if not values.get(key)]
    if missing:
        raise ValueError(f"environment file is missing required keys: {', '.join(missing)}")
    values["ENVIRONMENT"] = "production"
    return values


def main() -> int:
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} ENV_FILE COMMAND [ARG ...]", file=sys.stderr)
        return 2

    try:
        values = load_environment(Path(sys.argv[1]).resolve(strict=True))
    except (OSError, ValueError) as exc:
        print(f"Invalid backend environment file: {exc}", file=sys.stderr)
        return 1

    environment = os.environ.copy()
    environment.update(values)
    os.execvpe(sys.argv[2], sys.argv[2:], environment)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
