---
name: prp
description: Create a Product Requirements Proposal blueprint for a feature before implementation, including scope, phases, risks, and validation.
---

# Codex Adapter: prp

This is the Codex-native adapter for `.claude/skills/prp/SKILL.md`.

When invoked:
1. Read `.claude/skills/prp/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/prp/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with a concise implementation blueprint.
