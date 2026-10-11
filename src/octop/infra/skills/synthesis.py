"""Trajectory → skill synthesis — pure logic (no I/O).

Turns a stored chat trajectory into a SKILL.md draft: tool-call pairs are
extracted from ``tool`` events (see ``project_harness_chunk``), then rendered
as a markdown document with YAML front-matter matching the workspace skill
convention (``metadata.octop.{emoji,requires,label,summary}``).

The output is a *draft*: nothing is persisted here. Review and import go
through the regular skill surfaces (dashboard editor / skill packages /
SkillHub governance).
"""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from octop.infra.history.trajectory.types import TrajectoryEvent

_MAX_ARGS_CHARS = 400
_MAX_RESULT_CHARS = 600
_MAX_DOC_INVOCATIONS = 50
_SLUG_STRIP = re.compile(r"[^a-z0-9]+")


@dataclass(frozen=True)
class ToolInvocation:
    """One paired tool call → result, in trajectory order."""

    name: str
    args: Any
    result: Any
    ok: bool


def extract_tool_invocations(events: Iterable[TrajectoryEvent]) -> list[ToolInvocation]:
    """Pair ``tool_call_chunk`` / ``tool_result`` payloads by ``call_id``.

    Calls without a matching result are kept with ``result=None`` and
    ``ok=False`` (the trajectory may have been pruned mid-call). Calls or
    results flagged ``is_error`` mark the invocation failed. Events that are
    not kind ``tool`` or carry neither ``args`` nor ``result`` are ignored.
    """
    pending: dict[str, dict[str, Any]] = {}
    order: list[str] = []
    out: list[ToolInvocation] = []
    for event in events:
        if event.kind != "tool":
            continue
        call_id = event.payload.get("call_id")
        if not isinstance(call_id, str) or not call_id:
            continue
        if "args" in event.payload:
            if call_id not in pending:
                order.append(call_id)
            pending[call_id] = {
                "name": str(event.payload.get("name") or "tool"),
                "args": event.payload.get("args"),
                "call_error": event.is_error,
                "result": None,
                "result_error": False,
                "resolved": False,
            }
            continue
        if "result" not in event.payload:
            continue
        slot = pending.get(call_id)
        if slot is None:
            order.append(call_id)
            slot = {
                "name": str(event.payload.get("name") or "tool"),
                "args": None,
                "call_error": False,
            }
            pending[call_id] = slot
        slot["result"] = event.payload.get("result")
        slot["result_error"] = event.is_error
        slot["resolved"] = True
    for call_id in order:
        slot = pending[call_id]
        ok = bool(slot.get("resolved")) and not slot["call_error"] and not slot["result_error"]
        out.append(
            ToolInvocation(
                name=str(slot["name"]),
                args=slot.get("args"),
                result=slot.get("result"),
                ok=ok,
            )
        )
    return out


def slugify_title(title: str) -> str:
    """Derive a kebab-case skill slug from a free-form title.

    CJK-only titles slugify to nothing, so a stable short hash suffix keeps
    the name unique and valid: ``skill-<8 hex>``.
    """
    slug = _SLUG_STRIP.sub("-", title.strip().lower()).strip("-")
    if slug:
        return slug
    digest = hashlib.sha1(title.strip().encode("utf-8")).hexdigest()[:8]
    return f"skill-{digest}"


def build_skill_doc(
    *,
    name: str,
    title: str,
    invocations: list[ToolInvocation],
    source_thread_id: str,
    agent_id: str,
    generated_at: datetime | None = None,
) -> str:
    """Render the SKILL.md draft (front-matter + body) for one trajectory."""
    when = generated_at or datetime.now(UTC)
    iso = when.astimezone(UTC).isoformat(timespec="seconds")
    shown = invocations[:_MAX_DOC_INVOCATIONS]
    failures = [inv for inv in shown if not inv.ok]

    lines: list[str] = [
        "---",
        f"name: {name}",
        "description: >-",
        f"  {title}。由成功轨迹自动生成的技能草稿：复现「{title}」场景下的工具调用序列与注意事项。",
        "metadata:",
        "  octop:",
        '    emoji: "🧬"',
        "    requires: {}",
        "    label:",
        f'      zh: "{title}"',
        f'      en: "{title}"',
        "    summary:",
        f'      zh: "{_one_line(title)}：沉淀自线程 {source_thread_id} 的 {len(shown)} 次工具调用。'
        f"经治理中枢审计后可发布到 SkillHub。" + '"',
        f'      en: "Auto-generated skill draft from thread {source_thread_id}'
        f' ({len(shown)} tool invocations). Audit before publishing."',
        f"    synthesized_from: {source_thread_id}",
        f"    synthesized_at: {iso}",
        f"    synthesized_by: {agent_id}",
        "---",
        "",
        f"# {title} 🧬",
        "",
        "## 概述",
        "",
        f"本技能由 YYC3-Pai 轨迹合成器从线程 `{source_thread_id}` 自动生成（{iso}，"
        f"Agent `{agent_id}`）。它把一次成功完成任务中的工具调用序列沉淀为可复用流程，"
        "供后续同类请求直接参考。",
        "",
        "## 适用场景",
        "",
        f"- 需要复现「{_one_line(title)}」的完整操作路径时。",
        "- 同类任务反复出现、希望减少逐步探索的开销时。",
        "",
        "## 工具调用序列",
        "",
    ]
    for index, inv in enumerate(shown, start=1):
        status = "✅ 成功" if inv.ok else "❌ 失败"
        lines.append(f"### {index}. `{inv.name}`（{status}）")
        lines.append("")
        args = _json_block(inv.args, _MAX_ARGS_CHARS)
        lines.extend(["**参数**", "", "```json", args, "```", ""])
        if inv.result is not None:
            result = _json_block(inv.result, _MAX_RESULT_CHARS)
            lines.extend(["**结果**", "", "```json", result, "```", ""])
        else:
            lines.extend(["**结果**", "", "（轨迹中未记录该调用的返回）", ""])
    lines.extend(
        [
            "## 注意事项",
            "",
        ]
    )
    if failures:
        lines.append(f"- 本轨迹包含 {len(failures)} 次失败调用，复现前请核对环境与前置条件。")
    else:
        lines.append("- 本轨迹的工具调用全部成功；不同环境下参数（路径、ID 等）仍需按实际调整。")
    if len(invocations) > _MAX_DOC_INVOCATIONS:
        lines.append(
            f"- 调用次数超过文档上限，仅展示前 {_MAX_DOC_INVOCATIONS} 次（共 {len(invocations)} 次）。"
        )
    lines.extend(
        [
            "- 本文档为自动草稿：发布前请经治理中枢审计，确认无敏感信息（密钥、个人隐私、内部路径）。",
            "- 保存入口：Dashboard 技能编辑器或 `POST /api/agents/{{aid}}/skills`。",
            "",
        ]
    )
    return "\n".join(lines)


def _one_line(text: str) -> str:
    return " ".join(text.split())


def _json_block(value: Any, max_chars: int) -> str:
    """Compact JSON for embedding in a fenced block; fall back to str()."""
    try:
        text = json.dumps(value, ensure_ascii=False, default=str)
    except (TypeError, ValueError):
        text = str(value)
    if len(text) > max_chars:
        text = text[: max_chars - 1].rstrip() + "…"
    return text
