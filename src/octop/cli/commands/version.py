"""pai version command."""

from __future__ import annotations

import click


@click.command("version")
def version() -> None:
    """Show the installed yyc3-pai version."""
    try:
        from importlib.metadata import version as _v

        v = _v("yyc3-pai")
    except Exception:
        v = "unknown"
    click.echo(f"pai v{v}")
