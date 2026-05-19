---
name: ai
description: Add AI features using the SaaS Factory AI templates, including chat, RAG, vision, structured output, tool use, and OpenRouter integrations.
---

# Codex Adapter: ai

This is the Codex-native adapter for `.claude/skills/ai/SKILL.md`.

When invoked:
1. Read `.claude/skills/ai/SKILL.md`.
2. Treat that file as the source of truth for the workflow.
3. Resolve relative `scripts/`, `references/`, and `assets/` paths from `.claude/skills/ai/`.
4. Execute the workflow directly in Codex; do not ask the user to run a slash command.
5. If the canonical skill file is missing, explain the missing path and continue with a best-effort Vercel AI SDK implementation.
