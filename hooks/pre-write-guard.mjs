#!/usr/bin/env node
import { classifyWrite } from "../lib/write-guard.mjs";
import { preToolDecision, readHookInput, requirePreToolInput, writeJson } from "../lib/protocol.mjs";

try {
  const input = requirePreToolInput(await readHookInput(), ["Write", "Edit"]);
  const filePath = input.tool_input.file_path ?? input.tool_input.path;
  const outcome = classifyWrite(filePath, process.env.CLAUDE_PROJECT_DIR);
  writeJson(preToolDecision(outcome.decision, `[${outcome.ruleId}] ${outcome.reason}`));
} catch (error) {
  writeJson(preToolDecision("deny", "[invalid-input] Hook input, project root, or policy is invalid; action denied."));
}
