import assert from "node:assert/strict";
import test from "node:test";
import { renderSettings } from "../scripts/render-settings.mjs";

test("renders exec-form commands for paths with spaces and quotes", () => {
  const settings = JSON.parse(renderSettings("/tmp/João's Claude toolkit"));
  const hook = settings.hooks.PreToolUse[0].hooks[0];
  assert.equal(hook.command, "node");
  assert.deepEqual(hook.args, ["/tmp/João's Claude toolkit/hooks/pre-bash-guard.mjs"]);
});

test("leaves no executable placeholder", () => {
  assert.doesNotMatch(renderSettings("/tmp/toolkit"), /__[A-Z_]+__/);
});
