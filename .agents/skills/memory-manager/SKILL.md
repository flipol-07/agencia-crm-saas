---
name: memory-manager
description: Manage persistent project memory in the repository, including user preferences, project decisions, feedback, and reference notes.
---

# Codex Adapter: memory-manager

This is the Codex-native adapter for `.claude/skills/memory-manager/SKILL.md`.

When invoked:
1. Read `.claude/skills/memory-manager/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/memory-manager/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with `.claude/memory` as the project-memory location.
