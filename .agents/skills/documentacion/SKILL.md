---
name: documentacion
description: Maintain project documentation, README files, technical notes, onboarding docs, and SaaS Factory usage guidance.
---

# Codex Adapter: documentacion

This is the Codex-native adapter for `.Codex/skills/documentacion/SKILL.md`.

When invoked:
1. Read `.Codex/skills/documentacion/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.Codex/skills/documentacion/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with clear, repo-local documentation updates.
