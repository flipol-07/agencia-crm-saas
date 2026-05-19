---
name: update-sf
description: Update a generated project to the latest SaaS Factory template version while preserving product-specific code and decisions.
---

# Codex Adapter: update-sf

This is the Codex-native adapter for `.claude/skills/update-sf/SKILL.md`.

When invoked:
1. Read `.claude/skills/update-sf/SKILL.md`.
2. Read `.claude/skills/update-sf/CODEX_COMPATIBILITY.md` when the update is about bringing an older project up to Codex compatibility.
3. Treat those files as the source of truth for the workflow.
4. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/update-sf/`.
5. Execute the workflow directly in Codex; do not ask the user to run a slash command.
6. For Codex upgrades, merge `.claude/`, `.codex/`, and `.agents/` into the target project, then add `AGENTS.md` and `CODEX.md` if they are missing.
7. If the canonical skill file is missing, explain the missing path and continue with a careful diff-based update plan.
