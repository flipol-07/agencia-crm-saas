---
name: autoresearch
description: Improve SaaS Factory skills through research, pattern capture, and iterative skill optimization.
---

# Codex Adapter: autoresearch

This is the Codex-native adapter for `.claude/skills/autoresearch/SKILL.md`.

When invoked:
1. Read `.claude/skills/autoresearch/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/autoresearch/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with a conservative research-and-documentation pass.
