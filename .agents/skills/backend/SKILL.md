---
name: backend
description: Implement backend work in SaaS Factory apps, including server actions, route handlers, validation, services, and business logic.
---

# Codex Adapter: backend

This is the Codex-native adapter for `.Codex/skills/backend/SKILL.md`.

When invoked:
1. Read `.Codex/skills/backend/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.Codex/skills/backend/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and follow existing backend patterns in `src/features`, `src/app/api`, and shared libraries.
