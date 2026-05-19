# Codex Skill Adapters

OpenAI Codex scans repository skills from `.agents/skills`. SaaS Factory V4 keeps the canonical skill bodies in `.claude/skills`.

Each adapter here makes one SaaS Factory skill discoverable by Codex, then points Codex to the canonical `.claude/skills/<skill>/SKILL.md` file for the complete workflow.
