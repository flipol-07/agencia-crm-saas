---
name: codebase-analyst
description: Analyze SaaS Factory architecture, file organization, dependencies, patterns, risks, and implementation options before changes.
---

# Codex Adapter: codebase-analyst

This is the Codex-native adapter for `.Codex/skills/codebase-analyst/SKILL.md`.

When invoked:
1. Read `.Codex/skills/codebase-analyst/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.Codex/skills/codebase-analyst/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with direct codebase analysis.
