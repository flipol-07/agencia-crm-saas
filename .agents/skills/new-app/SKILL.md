---
name: new-app
description: Define a new SaaS product from natural language, interview the user, and generate or update BUSINESS_LOGIC.md before implementation begins.
---

# Codex Adapter: new-app

This is the Codex-native adapter for `.claude/skills/new-app/SKILL.md`.

When invoked:
1. Read `.claude/skills/new-app/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/new-app/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with a best-effort SaaS product discovery flow.
