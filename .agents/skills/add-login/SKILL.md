---
name: add-login
description: Add complete Supabase email/password authentication, protected routes, session handling, and auth UI to a SaaS Factory app.
---

# Codex Adapter: add-login

This is the Codex-native adapter for `.claude/skills/add-login/SKILL.md`.

When invoked:
1. Read `.claude/skills/add-login/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/add-login/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with a conservative Supabase auth implementation.
