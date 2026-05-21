#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const projectDir = process.env.SAAS_FACTORY_PROJECT_DIR || process.cwd();

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

function readMcpConfig() {
  const mcpPath = path.join(projectDir, ".mcp.json");
  if (!existsSync(mcpPath)) return {};

  try {
    return JSON.parse(readFileSync(mcpPath, "utf8"));
  } catch {
    return {};
  }
}

function readSupabaseCliRef() {
  const refPath = path.join(projectDir, "supabase", ".temp", "project-ref");
  if (!existsSync(refPath)) return undefined;
  return readFileSync(refPath, "utf8").trim() || undefined;
}

function readMcpRef(mcpConfig) {
  const argvRef = process.argv
    .slice(2)
    .find((arg) => arg.startsWith("--project-ref="))
    ?.split("=")[1];
  if (argvRef && argvRef !== "YOUR_SUPABASE_PROJECT_REF") return argvRef;

  const server = mcpConfig?.mcpServers?.supabase || {};
  const args = server.args || [];
  const refArg = args.find((arg) => arg.startsWith("--project-ref="));
  return refArg?.split("=")[1] || server.projectRef;
}

function inferProjectRef(env, mcpConfig) {
  const mcpRef = readMcpRef(mcpConfig);
  if (mcpRef && mcpRef !== "YOUR_SUPABASE_PROJECT_REF") return mcpRef;

  if (env.SUPABASE_PROJECT_REF) return env.SUPABASE_PROJECT_REF;

  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const urlMatch = url?.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co\/?$/i);
  if (urlMatch) return urlMatch[1];

  return readSupabaseCliRef();
}

const mcpConfig = readMcpConfig();
const mcpServer = mcpConfig?.mcpServers?.supabase || {};
const env = readProjectEnv();
const projectRef = inferProjectRef(env, mcpConfig);
const accessToken =
  mcpServer?.env?.SUPABASE_ACCESS_TOKEN || env.SUPABASE_ACCESS_TOKEN;

if (!projectRef) {
  console.error(
    [
      "SaaS Factory Supabase MCP: no Supabase project ref found.",
      "Set --project-ref=... in .mcp.json, or set SUPABASE_PROJECT_REF / NEXT_PUBLIC_SUPABASE_URL.",
    ].join("\n")
  );
  process.exit(1);
}

if (!accessToken) {
  console.error(
    [
      "SaaS Factory Supabase MCP: SUPABASE_ACCESS_TOKEN is missing.",
      "Add it under mcpServers.supabase.env in .mcp.json, or export it in your shell.",
    ].join("\n")
  );
  process.exit(1);
}

const child = spawn(
  "npx",
  [
    "-y",
    "@supabase/mcp-server-supabase@latest",
    `--project-ref=${projectRef}`,
  ],
  {
    cwd: projectDir,
    env: {
      ...process.env,
      SUPABASE_ACCESS_TOKEN: accessToken,
    },
    stdio: "inherit",
  }
);

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
