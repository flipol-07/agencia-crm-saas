---
name: image-generation
description: Generate or edit visual assets, thumbnails, logos, banners, illustrations, and product imagery for SaaS Factory projects.
---

# Codex Adapter: image-generation

This is the Codex-native adapter for `.claude/skills/image-generation/SKILL.md`.

When invoked:
1. Read `.claude/skills/image-generation/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/image-generation/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with the available image-generation tooling.
