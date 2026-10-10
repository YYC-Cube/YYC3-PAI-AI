#!/usr/bin/env python3
"""YYC3-Docs 全链路校验 · verify all generated docs."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # YYC3-Docs

MD_DOCS = [
    "README.md", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md",
    "CHANGELOG.md", "docs/index.md", "docs/ARCHITECTURE.md", "docs/CICD.md",
    "docs/LABELS.md", "docs/RELEASE.md", "docs/STYLE-GUIDE.md",
]
YAML_DOCS = [
    ".github/workflows/ci.yml", ".github/workflows/release.yml",
    ".github/workflows/docs.yml", ".github/ISSUE_TEMPLATE/bug_report.yml",
    ".github/ISSUE_TEMPLATE/feature_request.yml",
    ".github/ISSUE_TEMPLATE/documentation.yml",
    ".github/ISSUE_TEMPLATE/config.yml", ".pre-commit-config.yaml", "mkdocs.yml",
]
KEY_FILES = ["LICENSE", "Makefile", "requirements.txt", "requirements-dev.txt",
             ".github/PULL_REQUEST_TEMPLATE.md", ".github/labels.json",
             "scripts/check_mermaid.py"]


def check_yaml() -> list[str]:
    errs = []
    try:
        import yaml  # noqa
    except ImportError:
        return ["pyyaml not installed — skip deep yaml check (files linted by IDE)"]
    for rel in YAML_DOCS:
        p = ROOT / rel
        if not p.exists():
            errs.append(f"MISSING: {rel}")
            continue
        try:
            # mkdocs.yml 的 !!python/name:* 为 mkdocs 运行时解析 tag，
            # 静态校验时用通配 constructor 忽略（避免误报）。
            class RT(yaml.SafeLoader):
                pass

            def _ignore_tag(loader, suffix, node):  # noqa: ANN001
                return str(node.value)

            RT.add_multi_constructor("tag:yaml.org,2002:python/", _ignore_tag)
            yaml.load(p.read_text(encoding="utf-8"), Loader=RT)
        except Exception as e:  # noqa: BLE001
            errs.append(f"YAML ERROR: {rel} → {e}")
    return errs


def check_md() -> list[str]:
    errs = []
    for rel in MD_DOCS:
        p = ROOT / rel
        if not p.exists():
            errs.append(f"MISSING: {rel}")
            continue
        t = p.read_text(encoding="utf-8")
        if t.count("```mermaid") != t.count("```") // 2 and t.count("```") % 2 != 0:
            errs.append(f"FENCE UNBALANCED: {rel}")
        if "yanyucloud.com" not in t and rel not in ("LICENSE",):
            errs.append(f"NO-CONTACT: {rel} 缺少企业邮箱引用")
    return errs


def check_labels() -> list[str]:
    p = ROOT / ".github/labels.json"
    if not p.exists():
        return ["MISSING: .github/labels.json"]
    data = json.loads(p.read_text(encoding="utf-8"))
    names = [d["name"] for d in data]
    dups = {n for n in names if names.count(n) > 1}
    need = {"feature", "bug", "documentation", "security", "breaking-change", "ci"}
    missing = need - set(names)
    errs = []
    if dups:
        errs.append(f"DUP LABELS: {dups}")
    if missing:
        errs.append(f"MISSING LABELS: {missing}")
    return errs


def check_keys() -> list[str]:
    return [f"MISSING: {k}" for k in KEY_FILES if not (ROOT / k).exists()]


def main() -> int:
    all_errs = check_keys() + check_yaml() + check_md() + check_labels()
    total = len(MD_DOCS) + len(YAML_DOCS) + len(KEY_FILES)
    print(f"YYC3-Docs verification: {total} files expected")
    if all_errs:
        print("FAILED:")
        print("\n".join(f"  ✘ {e}" for e in all_errs))
        return 1
    print("ALL PASS ✅ "
          f"(md={len(MD_DOCS)}, yaml={len(YAML_DOCS)}, key_files={len(KEY_FILES)}, "
          f"labels={len(json.loads((ROOT / '.github/labels.json').read_text()))})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
