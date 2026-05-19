# SaaS Factory + Codex

SaaS Factory V4 is optimized for OpenAI Codex with three layers:

- `AGENTS.md` is the Codex entrypoint for project instructions.
- `.agents/skills` is the Codex-native skill discovery layer.
- `.claude/skills` is the canonical SaaS Factory skill library with full instructions, references, scripts, and assets.

## How skills work

Codex discovers skills from `.agents/skills`. Each skill in this folder is a thin adapter that points to its canonical workflow in `.claude/skills/<skill>/SKILL.md`.

This keeps compatibility with Codex while preserving the SaaS Factory V4 structure.

## How config works

Codex project settings live in `.codex/config.toml`. A generated project should be marked as trusted in Codex so project-scoped config can load.

The committed config:

- Raises `project_doc_max_bytes` so the Factory OS instructions are not truncated too early.
- Adds `GEMINI.md` as a fallback project-doc filename.
- Keeps permissions scoped to the workspace.
- Avoids committed model, provider, token, or secret choices.

## MCP setup

Codex reads MCP servers from `.codex/config.toml`, not from `.mcp.json`.

Keep `.mcp.json` only for clients that use it. For Codex, add MCP servers under `[mcp_servers.<name>]` in `.codex/config.toml` and pass secrets through environment variables.

## Editing rules

When changing workflows:

1. Update `.claude/skills/<skill>/SKILL.md` first.
2. Update `.agents/skills/<skill>/SKILL.md` only if the Codex trigger description or adapter behavior changes.
3. Keep destructive skills, especially `eject-sf`, confirmation-gated.

## Upgrading older projects

If a project was generated before the Codex adapter layer existed, run the `update-sf` workflow and copy these paths from the latest factory:

1. `.codex/`
2. `.agents/skills/`
3. `AGENTS.md`
4. `CODEX.md`

The project should keep `.claude/skills/` as the canonical workflow library.
