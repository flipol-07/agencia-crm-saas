# Codex Project Configuration

This folder contains OpenAI Codex project-scoped configuration for generated SaaS Factory apps.

Codex reads this file only after the project is trusted:

- `.codex/config.toml` keeps AGENTS.md capacity high enough for the Factory OS.
- `.agents/skills` exposes SaaS Factory skills through Codex-native skill discovery.
- `.claude/skills` remains the source of truth for the full SaaS Factory V4 skill bodies and resources.

MCP servers belong in `.codex/config.toml` for Codex. Keep secrets in environment variables, never in committed files.
