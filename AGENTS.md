# SaaS Factory V4 for Codex

Use `CLAUDE.md` as the main project operating manual for this generated app.

Codex-specific rules:

- Treat `CLAUDE.md` as the source of truth for workflow, architecture, and user interaction style.
- Use repository skills from `.agents/skills/`.
- Those adapters point to the canonical SaaS Factory workflows under `.claude/skills/`.
- Keep `.claude/` as the factory toolbox and project memory location.
- Keep `.codex/` for Codex project configuration.
- Prefer additive updates when running `update-sf`; do not overwrite app code in `src/`.

If the user asks to upgrade an older generated project for Codex support, use the `update-sf` workflow and ensure these paths exist:

1. `.codex/`
2. `.agents/skills/`
3. `AGENTS.md`
4. `CODEX.md`

Do not remove `.claude/`. It remains the canonical SaaS Factory library in this template.

<!-- SAAS-FACTORY-AGENT-CONFIG:START -->
## Agent MCP Auto-Config

- Claude Code reads this project's `.mcp.json`.
- Codex reads this project's `.codex/config.toml`.
- Antigravity IDE/CLI uses global MCP entries prefixed with `sf-crm-aurie-6d436f38-` and `cwd` fixed to this folder.
- Supabase MCP is launched through `scripts/mcp/supabase.mjs`, which reads `--project-ref=...` and `SUPABASE_ACCESS_TOKEN` from `.mcp.json` first.
- Supabase project ref detected: `lqgdjvecnahcdmmkncjs`.
<!-- SAAS-FACTORY-AGENT-CONFIG:END -->
