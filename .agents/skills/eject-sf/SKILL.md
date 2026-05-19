---
name: eject-sf
description: Remove SaaS Factory scaffolding from a generated project only after explicit confirmation, leaving the functional product code.
---

# Codex Adapter: eject-sf

This is the Codex-native adapter for `.claude/skills/eject-sf/SKILL.md`.

When invoked:
1. Read `.claude/skills/eject-sf/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/eject-sf/`.
4. This workflow is destructive; get explicit user confirmation before deleting factory files.
5. If the canonical skill file is missing, explain the missing path and do not perform destructive cleanup without a precise file list and confirmation.
