#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const projectDir = path.resolve(process.argv[2] || process.cwd());
const homeDir = os.homedir();
const quiet = process.argv.includes("--quiet");

const managedStart = "# >>> SaaS Factory managed MCPs >>>";
const managedEnd = "# <<< SaaS Factory managed MCPs <<<";
const docsStart = "<!-- SAAS-FACTORY-AGENT-CONFIG:START -->";
const docsEnd = "<!-- SAAS-FACTORY-AGENT-CONFIG:END -->";

function log(message) {
  if (!quiet) console.log(message);
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const env = {};
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }

  return env;
}

function readProjectEnv() {
  return {
    ...parseEnvFile(path.join(projectDir, ".env")),
    ...parseEnvFile(path.join(projectDir, ".env.local")),
    ...process.env,
  };
}

function inferProjectRef(env) {
  if (env.SUPABASE_PROJECT_REF) return env.SUPABASE_PROJECT_REF;

  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const urlMatch = url?.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co\/?$/i);
  if (urlMatch) return urlMatch[1];

  const cliRefPath = path.join(projectDir, "supabase", ".temp", "project-ref");
  if (existsSync(cliRefPath)) return readFileSync(cliRefPath, "utf8").trim();

  const mcpPath = path.join(projectDir, ".mcp.json");
  if (existsSync(mcpPath)) {
    try {
      const config = JSON.parse(readFileSync(mcpPath, "utf8"));
      const args = config?.mcpServers?.supabase?.args || [];
      const refArg = args.find((arg) => arg.startsWith("--project-ref="));
      return refArg?.split("=")[1];
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function readMcpSupabaseConfig() {
  const mcpPath = path.join(projectDir, ".mcp.json");
  const config = readJson(mcpPath, { mcpServers: {} });
  const server = config?.mcpServers?.supabase || {};
  const refArg = (server.args || []).find((arg) => arg.startsWith("--project-ref="));

  return {
    projectRef:
      server.projectRef ||
      refArg?.split("=")[1] ||
      undefined,
    accessToken: server?.env?.SUPABASE_ACCESS_TOKEN,
  };
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug || "project";
}

function stableId(value) {
  const hex = crypto.createHash("sha1").update(value).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

function ensureAgentSkillAlias() {
  const aliasPath = path.join(projectDir, ".agent");
  const targetPath = path.join(projectDir, ".agents");
  if (!existsSync(targetPath) || existsSync(aliasPath)) return;
  symlinkSync(".agents", aliasPath);
}

function writeClaudeMcpConfig() {
  const mcpPath = path.join(projectDir, ".mcp.json");
  const config = readJson(mcpPath, { mcpServers: {} });
  const projectEnv = readProjectEnv();
  const previousSupabase = config?.mcpServers?.supabase || {};
  const previousProjectRef =
    previousSupabase.projectRef ||
    (previousSupabase.args || [])
      .find((arg) => arg.startsWith("--project-ref="))
      ?.split("=")[1];
  const previousEnv = previousSupabase.env || {};

  config.mcpServers ||= {};
  config.mcpServers["next-devtools"] = {
    command: "npx",
    args: ["-y", "next-devtools-mcp@latest"],
  };
  config.mcpServers.playwright = {
    command: "npx",
    args: ["@playwright/mcp@latest"],
  };
  config.mcpServers.supabase = {
    command: "node",
    args: [
      "scripts/mcp/supabase.mjs",
      `--project-ref=${previousProjectRef || inferProjectRef(readProjectEnv()) || "YOUR_SUPABASE_PROJECT_REF"}`,
    ],
    env: {
      SUPABASE_ACCESS_TOKEN:
        previousEnv.SUPABASE_ACCESS_TOKEN ||
        projectEnv.SUPABASE_ACCESS_TOKEN ||
        process.env.SUPABASE_ACCESS_TOKEN ||
        "YOUR_SUPABASE_ACCESS_TOKEN",
    },
  };
  writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`);
}

function syncCodexConfig() {
  const codexDir = path.join(projectDir, ".codex");
  const configPath = path.join(codexDir, "config.toml");
  mkdirSync(codexDir, { recursive: true });

  const base = existsSync(configPath)
    ? readFileSync(configPath, "utf8")
    : [
        "project_doc_max_bytes = 65536",
        'project_doc_fallback_filenames = ["GEMINI.md"]',
        'default_permissions = ":workspace"',
        "",
        "[features]",
        "codex_hooks = true",
        "multi_agent = true",
        "shell_tool = true",
        "",
      ].join("\n");

  const managed = [
    managedStart,
    "",
    "[mcp_servers.next-devtools]",
    'command = "npx"',
    'args = ["-y", "next-devtools-mcp@latest"]',
    "enabled = true",
    "",
    "[mcp_servers.playwright]",
    'command = "npx"',
    'args = ["@playwright/mcp@latest"]',
    "enabled = true",
    "",
    "[mcp_servers.supabase]",
    'command = "node"',
    'args = ["scripts/mcp/supabase.mjs"]',
    "enabled = true",
    "",
    managedEnd,
    "",
  ].join("\n");

  const pattern = new RegExp(`${managedStart}[\\s\\S]*?${managedEnd}\\n?`, "m");
  const next = pattern.test(base)
    ? base.replace(pattern, managed)
    : `${base.trimEnd()}\n\n${managed}`;
  writeFileSync(configPath, next);
}

function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function syncAntigravity(projectRef) {
  const id = stableId(projectDir);
  const slug = slugify(path.basename(projectDir));
  const prefix = `sf-${slug}-${id.slice(0, 8)}`;
  const antigravityDir = path.join(homeDir, ".gemini", "antigravity");
  const sharedConfigDir = path.join(homeDir, ".gemini", "config");
  const projectsDir = path.join(sharedConfigDir, "projects");
  const projectLinksDir = path.join(homeDir, ".antigravitycli");
  const mcpPath = path.join(antigravityDir, "mcp_config.json");
  const sharedMcpPath = path.join(sharedConfigDir, "mcp_config.json");

  mkdirSync(antigravityDir, { recursive: true });
  mkdirSync(sharedConfigDir, { recursive: true });
  mkdirSync(projectsDir, { recursive: true });
  mkdirSync(projectLinksDir, { recursive: true });

  const config = readJson(mcpPath, { mcpServers: {} });
  config.mcpServers ||= {};

  config.mcpServers[`${prefix}-next-devtools`] = {
    command: "npx",
    args: ["-y", "next-devtools-mcp@latest"],
    cwd: projectDir,
    disabled: false,
  };

  config.mcpServers[`${prefix}-playwright`] = {
    command: "npx",
    args: ["@playwright/mcp@latest"],
    cwd: projectDir,
    disabled: false,
  };

  config.mcpServers[`${prefix}-supabase`] = {
    command: "node",
    args: [path.join(projectDir, "scripts", "mcp", "supabase.mjs")],
    cwd: projectDir,
    disabled: false,
  };

  writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`);

  if (existsSync(sharedMcpPath)) {
    const stat = lstatSync(sharedMcpPath);
    if (!stat.isSymbolicLink()) unlinkSync(sharedMcpPath);
  }
  if (!existsSync(sharedMcpPath)) symlinkSync(mcpPath, sharedMcpPath);

  const projectConfigPath = path.join(projectsDir, `${id}.json`);
  const projectConfig = {
    id,
    name: projectDir,
    projectResources: {
      resources: [
        {
          gitFolder: {
            folderUri: `file://${projectDir}`,
            allowWrite: true,
          },
        },
      ],
    },
  };
  writeFileSync(projectConfigPath, `${JSON.stringify(projectConfig, null, 2)}\n`);

  const linkPath = path.join(projectLinksDir, `${id}.json`);
  if (!existsSync(linkPath)) symlinkSync(projectConfigPath, linkPath);

  return { id, prefix, projectRef };
}

function updateDocBlock(fileName, antigravity) {
  const filePath = path.join(projectDir, fileName);
  if (!existsSync(filePath)) return;

  const current = readFileSync(filePath, "utf8");
  const refText = antigravity.projectRef
    ? `Supabase project ref detected: \`${antigravity.projectRef}\`.`
    : "Supabase project ref is read at runtime from `.mcp.json`.";
  const block = [
    docsStart,
    "## Agent MCP Auto-Config",
    "",
    "- Claude Code reads this project's `.mcp.json`.",
    "- Codex reads this project's `.codex/config.toml`.",
    `- Antigravity IDE/CLI uses global MCP entries prefixed with \`${antigravity.prefix}-\` and \`cwd\` fixed to this folder.`,
    "- Supabase MCP is launched through `scripts/mcp/supabase.mjs`, which reads `--project-ref=...` and `SUPABASE_ACCESS_TOKEN` from `.mcp.json` first.",
    `- ${refText}`,
    docsEnd,
    "",
  ].join("\n");

  const pattern = new RegExp(`${docsStart}[\\s\\S]*?${docsEnd}\\n?`, "m");
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : `${current.trimEnd()}\n\n${block}`;
  writeFileSync(filePath, next);
}

const env = readProjectEnv();
const mcpSupabase = readMcpSupabaseConfig();
const projectRef = mcpSupabase.projectRef || inferProjectRef(env);

ensureAgentSkillAlias();
writeClaudeMcpConfig();
syncCodexConfig();
const antigravity = syncAntigravity(projectRef);
updateDocBlock("AGENTS.md", antigravity);
updateDocBlock("GEMINI.md", antigravity);

log(`SaaS Factory agent config synced for ${projectDir}`);
log(`Antigravity MCP prefix: ${antigravity.prefix}-`);
if (projectRef) log(`Supabase project ref: ${projectRef}`);
else log("Supabase project ref: pending .env.local");
