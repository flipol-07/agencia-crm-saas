---
name: landing
description: Build a cinematic high-conversion landing page with scroll-stop product storytelling, AIDA/PAS copy, and polished responsive UI.
---

# Codex Adapter: landing

This is the Codex-native adapter for `.claude/skills/website-3d/SKILL.md`.

When invoked:
1. Read `.claude/skills/website-3d/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/website-3d/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with a best-effort landing-page build using SaaS Factory conventions.
