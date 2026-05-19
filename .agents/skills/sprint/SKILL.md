---
name: sprint
description: Execute a small, well-scoped implementation task quickly while following SaaS Factory architecture and verification standards.
---

# Codex Adapter: sprint

This is the Codex-native adapter for `.Codex/skills/sprint/SKILL.md`.

When invoked:
1. Read `.Codex/skills/sprint/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.Codex/skills/sprint/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with a focused implementation pass.
