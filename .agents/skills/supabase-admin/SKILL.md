---
name: supabase-admin
description: Design and apply Supabase database changes, migrations, RLS policies, auth/storage setup, data queries, and metrics.
---

# Codex Adapter: supabase-admin

This is the Codex-native adapter for `.claude/skills/supabase/SKILL.md`.

When invoked:
1. Read `.claude/skills/supabase/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/supabase/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and use available Supabase MCP/tools or migration files conservatively.
