---
name: bucle-agentico
description: Implement complex multi-file features by phases, mapping real context before each phase and validating as the system evolves.
---

# Codex Adapter: bucle-agentico

This is the Codex-native adapter for `.claude/skills/bucle-agentico/SKILL.md`.

When invoked:
1. Read `.claude/skills/bucle-agentico/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/bucle-agentico/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with phased context mapping, implementation, and validation.
