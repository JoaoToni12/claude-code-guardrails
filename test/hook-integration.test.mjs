import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

function invoke(script, payload, environment = {}) {
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    env: { ...process.env, CLAUDE_PROJECT_DIR: process.cwd(), ...environment },
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("Bash hook emits the documented PreToolUse shape", () => {
  const output = invoke("hooks/pre-bash-guard.mjs", {
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: { command: "git status" },
  });
  assert.equal(output.hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(output.hookSpecificOutput.permissionDecision, "allow");
});

test("malformed input fails closed", () => {
  const output = invoke("hooks/pre-bash-guard.mjs", { tool_name: "Bash" });
  assert.equal(output.hookSpecificOutput.permissionDecision, "deny");
});

test("Write hook uses project root even when cwd changes", () => {
  const output = invoke("hooks/pre-write-guard.mjs", {
    hook_event_name: "PreToolUse",
    tool_name: "Write",
    cwd: "/tmp",
    tool_input: { file_path: "src/app.mjs" },
  });
  assert.equal(output.hookSpecificOutput.permissionDecision, "allow");
});

test("PostToolUse never echoes invalid JSON contents", () => {
  const root = mkdtempSync(join(tmpdir(), "claude-post-json-"));
  writeFileSync(join(root, "broken.json"), '{"secret":"synthetic-private-value"');
  const output = invoke("hooks/post-json-validator.mjs", {
    hook_event_name: "PostToolUse",
    tool_name: "Write",
    cwd: "/tmp",
    tool_input: { file_path: "broken.json" },
  }, { CLAUDE_PROJECT_DIR: root });
  assert.doesNotMatch(JSON.stringify(output), /synthetic-private-value/);
});

test("invalid policy fails closed with a structured denial", () => {
  const result = spawnSync(process.execPath, ["hooks/pre-bash-guard.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, AI_BUILDER_POLICY_PATH: "/missing/policy.json" },
    input: JSON.stringify({
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command: "git status" },
    }),
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, "deny");
});
