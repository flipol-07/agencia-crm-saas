---
name: primer
description: Load full project context at the start of a session: AGENTS.md, business logic, implemented routes, features, commands, and available tools.
---

# Codex Adapter: primer

This is the Codex-native adapter for `.claude/skills/primer/SKILL.md`.

When invoked:
1. Read `.claude/skills/primer/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/primer/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue by summarizing the repo structure and current app state.
