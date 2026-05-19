---
name: vercel-deployer
description: Prepare and troubleshoot Vercel deployment, environment variables, build settings, domains, and production readiness.
---

# Codex Adapter: vercel-deployer

This is the Codex-native adapter for `.Codex/skills/vercel-deployer/SKILL.md`.

When invoked:
1. Read `.Codex/skills/vercel-deployer/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.Codex/skills/vercel-deployer/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with Vercel deployment best practices.
