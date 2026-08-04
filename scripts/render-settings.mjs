#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = fileURLToPath(new URL("..", import.meta.url));
const TEMPLATE_PATH = resolve(REPOSITORY_ROOT, "settings.example.json");

function parseArguments(args) {
  const writeIndex = args.indexOf("--write");
  if (writeIndex === -1) return Object.freeze({ write: false, output: null });
  const candidate = args[writeIndex + 1];
  const output = candidate && !candidate.startsWith("--")
    ? resolve(process.cwd(), candidate)
    : resolve(process.cwd(), ".claude/settings.local.json");
  return Object.freeze({ write: true, output });
}

const COMMAND_PATHS = Object.freeze({
  __PRE_BASH_GUARD_PATH__: "hooks/pre-bash-guard.mjs",
  __PRE_WRITE_GUARD_PATH__: "hooks/pre-write-guard.mjs",
  __POST_JSON_VALIDATOR_PATH__: "hooks/post-json-validator.mjs",
});

function replaceCommands(value, root) {
  if (Array.isArray(value)) return value.map((item) => replaceCommands(item, root));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceCommands(item, root)]));
  }
  const relativePath = COMMAND_PATHS[value];
  return relativePath ? resolve(root, relativePath) : value;
}

export function renderSettings(root = REPOSITORY_ROOT) {
  const template = JSON.parse(readFileSync(TEMPLATE_PATH, "utf8"));
  return `${JSON.stringify(replaceCommands(template, root), null, 2)}\n`;
}

function runCli() {
  const options = parseArguments(process.argv.slice(2));
  const rendered = renderSettings();
  if (!options.write) return process.stdout.write(rendered);
  mkdirSync(dirname(options.output), { recursive: true });
  writeFileSync(options.output, rendered, { encoding: "utf8", mode: 0o600 });
  return process.stdout.write(`wrote ${options.output}\n`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
