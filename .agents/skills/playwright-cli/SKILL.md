---
name: playwright-cli
description: Validate UI and user flows with Playwright, including browser navigation, screenshots, interaction checks, and regression verification.
---

# Codex Adapter: playwright-cli

This is the Codex-native adapter for `.claude/skills/playwright-cli/SKILL.md`.

When invoked:
1. Read `.claude/skills/playwright-cli/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/playwright-cli/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with the available Playwright or browser validation tools.
