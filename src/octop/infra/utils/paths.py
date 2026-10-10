"""Filesystem layout for the YYC3-Pai install root (``~/.yyc3-pai``).

Legacy ``~/.octop`` installs are adopted automatically: when the new root
does not exist but the legacy one does, the directory (and the legacy
``octop.db`` file inside it) are renamed in place. If a rename fails (e.g.
permissions), the legacy path keeps being used.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

#: Preferred install-root directory name.
DIRNAME = ".yyc3-pai"
#: Upstream directory name, accepted for legacy installs.
LEGACY_DIRNAME = ".octop"
#: Preferred install-root env var.
HOME_ENV = "YYC3_PAI_HOME"
#: Legacy install-root env var.
LEGACY_HOME_ENV = "OCTOP_HOME"
#: Preferred SQLite database file name.
DB_FILENAME = "yyc3-pai.db"
#: Legacy SQLite database file name.
LEGACY_DB_FILENAME = "octop.db"
#: Preferred runtime log file name.
LOG_FILENAME = "yyc3-pai.log"
#: Legacy runtime log file name.
LEGACY_LOG_FILENAME = "octop.log"


def _rename_inplace(src: Path, dst: Path) -> bool:
    """Rename ``src`` -> ``dst``; return True on success, False on any OSError."""
    try:
        src.rename(dst)
    except OSError:
        return False
    return True


def _resolve_default_root() -> Path:
    home = Path.home()
    new_root = home / DIRNAME
    if new_root.exists():
        return new_root
    legacy_root = home / LEGACY_DIRNAME
    if legacy_root.exists() and _rename_inplace(legacy_root, new_root):
        return new_root
    if legacy_root.exists():
        return legacy_root
    return new_root


@dataclass(frozen=True)
class PathLayout:
    root: Path

    @classmethod
    def from_env(cls) -> PathLayout:
        """Resolve install root from env or the home-directory default.

        Precedence: ``YYC3_PAI_HOME`` -> legacy ``OCTOP_HOME`` ->
        ``~/.yyc3-pai`` (with ``~/.octop`` adoption).
        """
        raw = os.environ.get(HOME_ENV, "").strip()
        if raw:
            return cls(Path(raw).expanduser())
        raw = os.environ.get(LEGACY_HOME_ENV, "").strip()
        if raw:
            return cls(Path(raw).expanduser())
        return cls(_resolve_default_root())

    @property
    def db(self) -> Path:
        """SQLite path; a legacy ``octop.db`` in the root is adopted once."""
        new_db = self.root / DB_FILENAME
        if new_db.exists():
            return new_db
        legacy_db = self.root / LEGACY_DB_FILENAME
        if legacy_db.exists() and _rename_inplace(legacy_db, new_db):
            return new_db
        if legacy_db.exists():
            return legacy_db
        return new_db

    @property
    def logs_dir(self) -> Path:
        """Structured runtime logs: ``<root>/logs/``."""
        return self.root / "logs"

    @property
    def log(self) -> Path:
        """Runtime log path; a legacy ``octop.log`` is adopted once."""
        new_log = self.logs_dir / LOG_FILENAME
        if new_log.exists():
            return new_log
        legacy_log = self.logs_dir / LEGACY_LOG_FILENAME
        if legacy_log.exists() and _rename_inplace(legacy_log, new_log):
            return new_log
        if legacy_log.exists():
            return legacy_log
        return new_log

    def ensure_logs_dir(self) -> Path:
        """Create the logs directory and return it."""
        out = self.logs_dir
        out.mkdir(parents=True, exist_ok=True)
        return out

    def ensure_log(self) -> Path:
        """Create the logs directory and return the runtime log path."""
        self.ensure_logs_dir()
        return self.log

    @property
    def config(self) -> Path:
        return self.root / "config.json"

    @property
    def users_dir(self) -> Path:
        return self.root / "users"

    def user_dir(self, username: str) -> Path:
        return self.users_dir / username

    @property
    def agents_dir(self) -> Path:
        """Global agents directory: ``<root>/agents/``."""
        return self.root / "agents"

    @property
    def expert_market_dir(self) -> Path:
        """Cached SkillHub expert templates: ``<root>/expert_market/``."""
        return self.root / "expert_market"

    @property
    def published_experts_dir(self) -> Path:
        """User-published expert snapshots: ``<root>/published_experts/``."""
        return self.root / "published_experts"

    @property
    def skill_packages_dir(self) -> Path:
        """Global skill package content: ``<root>/skill-packages/``."""
        return self.root / "skill-packages"

    @property
    def knowledge_dir(self) -> Path:
        """Global knowledge base files: ``<root>/knowledge/``."""
        return self.root / "knowledge"

    def agent_workspace(self, agent_id: str) -> Path:
        """Global agent workspace: ``<root>/agents/<id>/``."""
        return self.agents_dir / agent_id

    def ensure_agent_workspace(self, agent_id: str) -> Path:
        """Global agent workspace, mkdir -p."""
        out = self.agent_workspace(agent_id)
        out.mkdir(parents=True, exist_ok=True)
        return out

    def ensure_root(self) -> Path:
        self.root.mkdir(parents=True, exist_ok=True)
        return self.root

    @property
    def plugins_dir(self) -> Path:
        return self.root / "plugins"

    @property
    def tool_guard_rules_dir(self) -> Path:
        """User-editable command guard rules: ``<root>/security/tool_guard/``."""
        return self.root / "security" / "tool_guard"

    @property
    def tool_guard_rules_file(self) -> Path:
        return self.tool_guard_rules_dir / "dangerous_shell_commands.yaml"

    @property
    def backups_dir(self) -> Path:
        """Stored system backup archives: ``<root>/backups/``."""
        return self.root / "backups"

    def ensure_backups_dir(self) -> Path:
        out = self.backups_dir
        out.mkdir(parents=True, exist_ok=True)
        return out

    def backup_file(self, filename: str) -> Path:
        """Resolve a backup archive path under :attr:`backups_dir` (basename only)."""
        return self.backups_dir / Path(filename).name

    @property
    def user_avatars_dir(self) -> Path:
        """Uploaded user portraits: ``<root>/avatars/users/``."""
        return self.root / "avatars" / "users"

    @property
    def role_avatars_dir(self) -> Path:
        """Uploaded role portraits: ``<root>/avatars/roles/``."""
        return self.root / "avatars" / "roles"

    @property
    def ssl_dir(self) -> Path:
        """TLS certificates and ACME account keys: ``<root>/ssl/``."""
        return self.root / "ssl"

    def ensure_ssl_dir(self) -> Path:
        out = self.ssl_dir
        out.mkdir(parents=True, exist_ok=True)
        return out

    @property
    def connector_cli_dir(self) -> Path:
        """Per-instance CLI config roots: ``<root>/connector-cli/``."""
        return self.root / "connector-cli"

    def connector_cli_instance_dir(self, kind: str, instance_key: str) -> Path:
        """Isolated config dir for one connector CLI instance."""
        safe_kind = Path(kind).name
        safe_key = (
            "".join(ch if ch.isalnum() or ch in "-_" else "_" for ch in instance_key)[:80]
            or "default"
        )
        return self.connector_cli_dir / safe_kind / safe_key

    def ensure_connector_cli_instance_dir(self, kind: str, instance_key: str) -> Path:
        out = self.connector_cli_instance_dir(kind, instance_key)
        out.mkdir(parents=True, exist_ok=True)
        return out
