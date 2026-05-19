---
name: skill-creator
description: Create or update SaaS Factory skills with correct SKILL.md metadata, focused workflow instructions, and optional resources.
---

# Codex Adapter: skill-creator

This is the Codex-native adapter for `.claude/skills/skill-creator/SKILL.md`.

When invoked:
1. Read `.claude/skills/skill-creator/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/skill-creator/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue using Codex skill conventions.
