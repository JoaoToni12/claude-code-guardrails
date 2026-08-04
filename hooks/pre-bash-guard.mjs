#!/usr/bin/env node
import { classifyBash } from "../lib/bash-guard.mjs";
import { preToolDecision, readHookInput, requirePreToolInput, writeJson } from "../lib/protocol.mjs";

try {
  const input = requirePreToolInput(await readHookInput(), ["Bash"]);
  const outcome = classifyBash(input.tool_input.command);
  writeJson(preToolDecision(outcome.decision, `[${outcome.ruleId}] ${outcome.reason}`));
} catch (error) {
  writeJson(preToolDecision("deny", "[invalid-input] Hook input or policy is invalid; action denied."));
}
