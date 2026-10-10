"""Load nested locale JSON and resolve dot-path keys."""

from __future__ import annotations

import json
from functools import lru_cache
from importlib import resources
from typing import Any

from octop.infra.utils.locale import Locale, normalize_locale

_FALLBACK_LOCALE: Locale = "en"


def _resolve_node(table: dict[str, Any], key: str) -> str | None:
    node: Any = table
    for part in key.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node if isinstance(node, str) else None


def _available_locales() -> tuple[str, ...]:
    """Discover bundled locale tables (en.json, zh.json, plus future packs)."""
    root = resources.files("octop.i18n")
    found = sorted(
        entry.name[: -len(".json")]
        for entry in root.iterdir()
        if entry.name.endswith(".json") and entry.is_file()
    )
    return tuple(found) if "en" in found else ("en",)


@lru_cache(maxsize=1)
def _load_all() -> dict[Locale, dict[str, Any]]:
    out: dict[Locale, dict[str, Any]] = {}
    for loc in _available_locales():
        raw = resources.files("octop.i18n").joinpath(f"{loc}.json").read_text(encoding="utf-8")
        out[loc] = json.loads(raw)
    return out


def lookup(key: str, locale: str | Locale) -> str | None:
    loc = normalize_locale(str(locale))
    tables = _load_all()
    text = _resolve_node(tables[loc], key)
    if text is not None:
        return text
    if loc != _FALLBACK_LOCALE:
        return _resolve_node(tables[_FALLBACK_LOCALE], key)
    return None


def tr(key: str, locale: str | Locale = "en", **kwargs: object) -> str:
    """Resolve *key* (e.g. ``slash.help.title``) for *locale*, fallback to ``en``."""
    text = lookup(key, locale)
    if text is None:
        raise KeyError(key)
    return text.format(**kwargs) if kwargs else text


def flatten_keys(table: dict[str, Any], prefix: str = "") -> set[str]:
    keys: set[str] = set()
    for name, value in table.items():
        path = f"{prefix}.{name}" if prefix else name
        if isinstance(value, dict):
            keys.update(flatten_keys(value, path))
        elif isinstance(value, str):
            keys.add(path)
    return keys


def all_keys_for_locale(locale: Locale = "en") -> set[str]:
    return flatten_keys(_load_all()[locale])
