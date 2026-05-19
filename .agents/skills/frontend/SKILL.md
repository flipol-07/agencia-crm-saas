---
name: frontend
description: Implement frontend UI, React components, Tailwind styling, interactions, and responsive SaaS Factory user experiences.
---

# Codex Adapter: frontend

This is the Codex-native adapter for `.Codex/skills/frontend/SKILL.md`.

When invoked:
1. Read `.Codex/skills/frontend/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.Codex/skills/frontend/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and follow existing frontend patterns in `src/app`, `src/features`, and shared UI components.
