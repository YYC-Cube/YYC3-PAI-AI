"""TrajectorySkillSynthesizer — thread ownership + skill draft orchestration."""

from __future__ import annotations

from dataclasses import dataclass

from octop.infra.db.repos.threads import ThreadRepo
from octop.infra.db.repos.trajectory_events import TrajectoryEventRepo
from octop.infra.errors import ErrorCode, OctopError
from octop.infra.skills import synthesis


@dataclass(frozen=True)
class SkillDraft:
    name: str
    markdown: str


class TrajectorySkillSynthesizer:
    """Draft a SKILL.md from a thread's stored trajectory.

    Ownership mirrors the trajectory HTTP surface: only the thread's owner
    may synthesize (admins included via owner check on the row's user_id).
    The draft is returned, never persisted — audit and import are separate
    steps (dashboard editor / skill packages / SkillHub governance).
    """

    def __init__(self, *, trajectory_repo: TrajectoryEventRepo, thread_repo: ThreadRepo) -> None:
        self._trajectory_repo = trajectory_repo
        self._thread_repo = thread_repo

    def draft(self, *, thread_id: str, user_id: int, title: str) -> SkillDraft:
        row = self._thread_repo.get(thread_id)
        if row is None or row.user_id != user_id:
            raise OctopError(ErrorCode.NOT_FOUND, "thread not found")
        clean_title = " ".join(title.split()) or "未命名技能"
        invocations = synthesis.extract_tool_invocations(
            self._trajectory_repo.iter_for_export(thread_id)
        )
        if not invocations:
            raise OctopError(
                ErrorCode.SKILL_SYNTHESIS_EMPTY,
                "trajectory contains no tool invocations",
            )
        name = synthesis.slugify_title(clean_title)
        markdown = synthesis.build_skill_doc(
            name=name,
            title=clean_title,
            invocations=invocations,
            source_thread_id=thread_id,
            agent_id=row.agent_id,
        )
        return SkillDraft(name=name, markdown=markdown)
