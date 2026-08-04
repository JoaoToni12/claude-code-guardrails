#!/usr/bin/env node
import { validateJsonFile } from "../lib/json-check.mjs";
import { postToolContext, readHookInput, writeJson } from "../lib/protocol.mjs";

try {
  const input = await readHookInput();
  const filePath = input.tool_input?.file_path ?? input.tool_input?.path;
  const outcome = validateJsonFile(filePath, process.env.CLAUDE_PROJECT_DIR);
  if (outcome.status === "invalid") writeJson(postToolContext(outcome.message));
} catch (error) {
  writeJson(postToolContext("JSON validation hook could not safely inspect this write."));
}
