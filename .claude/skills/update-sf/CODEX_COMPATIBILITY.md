# update-sf: Codex compatibility upgrade

Use this update path when a project was created from an older SaaS Factory copy and needs the Codex integration layer.

## Goal

Bring an existing generated project up to Codex compatibility without recreating the app and without overwriting product-specific code.

## What update-sf should merge

Merge these paths from the latest factory template into the target project:

1. `.claude/`
2. `.agents/`
3. `.codex/`

Add these files if they do not exist yet:

1. `AGENTS.md`
2. `CODEX.md`

## Merge rules

- Prefer additive updates.
- Do not overwrite product code under `src/`.
- Do not replace `CLAUDE.md` automatically.
- Keep `.claude/` as the canonical SaaS Factory skill and memory library.
- If `.codex/config.toml` already exists, merge carefully instead of replacing custom settings blindly.
- If `.agents/skills/` already exists, update only the SaaS Factory adapters and leave unrelated user skills alone.

## Minimal outcome

After the update, the target project should have:

- `AGENTS.md` for Codex project instructions
- `.codex/config.toml` for project-scoped Codex config
- `.agents/skills/*` adapters that point to `.claude/skills/*`
- `.claude/skills/*` still present as the source of truth

## Shell command

If the user installed the shell aliases from the setup repo, this upgrade should also work from inside the project with:

```bash
update-sf
```
