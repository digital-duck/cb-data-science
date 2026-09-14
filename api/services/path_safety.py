"""Validate user-supplied path segments before they touch the filesystem.

domain_id / target / level / language / model all flow from query params
straight into path construction (executor.py, pdf_svc.py, catalog_svc.py).
Two pathlib behaviours make unvalidated input dangerous:

    Path('/a/b') / '/etc/passwd'  -> '/etc/passwd'      # absolute REPLACES the base
    Path('/a/b') / '../../etc'    -> '/a/b/../../etc'    # traversal is preserved

A value like `model=/tmp/x` or `domain_id=../../..` can therefore escape
`settings.public_domains` entirely before any mkdir/read/write. The fix is
two independent layers: reject anything that isn't a plain identifier
(cheapest, catches every case above since neither '/' nor '.' matches),
and separately assert the final resolved path is still inside the
expected base directory (belt-and-suspenders, catches anything the regex
alone might miss).
"""
import re

from fastapi import HTTPException
from pathlib import Path

# Letters, digits, underscore, hyphen — no '.', no '/', so this alone
# rejects both absolute-path replacement and '..' traversal.
_SAFE_SEGMENT = re.compile(r"^[A-Za-z0-9_-]+$")


def safe_segment(name: str, value: str) -> str:
    """Return `value` unchanged if it's a safe single path segment, else 400."""
    if not value or not _SAFE_SEGMENT.match(value):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {name}: {value!r} (letters, digits, _, - only)",
        )
    return value


def safe_optional_segment(name: str, value: str) -> str:
    """Like safe_segment, but an empty string (e.g. no model selected) is fine."""
    if value == "":
        return value
    return safe_segment(name, value)


def assert_within(path: Path, base: Path) -> Path:
    """Raise 400 if `path` (once resolved) isn't inside `base`."""
    resolved = path.resolve()
    if not resolved.is_relative_to(base.resolve()):
        raise HTTPException(status_code=400, detail="Path escapes the domains directory")
    return path
