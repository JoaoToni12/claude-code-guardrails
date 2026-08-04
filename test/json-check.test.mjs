import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateJsonFile } from "../lib/json-check.mjs";

function fixture(name, content) {
  const root = mkdtempSync(join(tmpdir(), "claude-json-test-"));
  writeFileSync(join(root, name), content);
  return [root, name];
}

test("accepts valid JSON", () => {
  const [root, path] = fixture("valid.json", '{"ok":true}');
  assert.equal(validateJsonFile(path, root).status, "valid");
});

test("reports invalid JSON without returning file contents", () => {
  const [root, path] = fixture("invalid.json", '{"token":"synthetic"');
  const outcome = validateJsonFile(path, root);
  assert.equal(outcome.status, "invalid");
  assert.doesNotMatch(outcome.message, /synthetic/);
  assert.equal(outcome.message, "JSON is not valid; repair it and rerun verification.");
});

test("ignores non-JSON writes", () => {
  assert.equal(validateJsonFile("README.md", process.cwd()).status, "not-applicable");
});
