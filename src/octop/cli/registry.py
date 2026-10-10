"""CLI command registry for lazy loading."""

from __future__ import annotations

# command name -> (relative module path, attribute name, short help)
COMMANDS: dict[str, tuple[str, str, str]] = {
    "memory": (".commands.memory", "memory", "Live memory maintenance (backup and slim)."),
    "init": (".commands.init", "init", "Bootstrap a YYC3-Pai server install."),
    "run": (".commands.run", "run", "Run the YYC3-Pai server in the foreground."),
    "service": (
        ".commands.service",
        "service",
        "System service lifecycle (start/stop/restart/status).",
    ),
    "config": (".commands.config", "config_group", "CLI defaults (pinned user/agent)."),
    "user": (".commands.user", "user", "User management commands (admin only)."),
    "agent": (".commands.agent", "agent", "Agent lifecycle commands."),
    "chats": (".commands.chats", "chats", "Chat REPL and session management."),
    "channel": (".commands.channel", "channel", "Channel management commands."),
    "cron": (".commands.cron", "cron", "Cron job management commands."),
    "provider": (".commands.provider", "provider", "Provider management (admin write)."),
    "models": (".commands.models", "models", "Provider presets and resolved models."),
    "skills": (".commands.skills", "skills", "Per-agent skill enable/disable."),
    "admin": (".commands.admin", "admin", "Admin commands."),
    "captcha": (
        ".commands.captcha",
        "captcha",
        "Login captcha maintenance (lockout escape hatch).",
    ),
    "version": (".commands.version", "version", "Show the installed yyc3-pai version."),
    "completion": (".commands.completion", "completion", "Shell completion utilities."),
    "update": (".commands.update", "update", "Check for and install a newer YYC3-Pai release."),
    "clean": (".commands.clean", "clean", "Remove CLI state or wipe the whole install home."),
    "backup": (".commands.backup", "backup", "Export and restore YYC3-Pai backups."),
    "acp": (".commands.acp", "acp_cmd", "Run YYC3-Pai agent as ACP server (stdio)."),
    "plugin": (".commands.plugin", "plugin", "Install and manage plugins."),
}
