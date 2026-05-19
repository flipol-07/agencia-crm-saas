---
name: calidad
description: Run quality checks, testing, linting, build verification, regression review, and release-readiness validation for SaaS Factory apps.
---

# Codex Adapter: calidad

This is the Codex-native adapter for `.Codex/skills/calidad/SKILL.md`.

When invoked:
1. Read `.Codex/skills/calidad/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.Codex/skills/calidad/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with available lint, typecheck, build, and browser checks.
