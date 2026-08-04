import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { classifyWrite } from "../lib/write-guard.mjs";

function workspace() {
  return mkdtempSync(join(tmpdir(), "claude-guard-test-"));
}

test("allows a regular source file", () => {
  assert.equal(classifyWrite("src/app.mjs", workspace()).decision, "allow");
});

test("asks before editing CI", () => {
  assert.equal(classifyWrite(".github/workflows/ci.yml", workspace()).decision, "ask");
});

test("asks before editing agent instructions", () => {
  assert.equal(classifyWrite("AGENTS.md", workspace()).decision, "ask");
});

test("denies private key files", () => {
  assert.equal(classifyWrite("certs/demo.pem", workspace()).decision, "deny");
  assert.equal(classifyWrite("certs/DEMO.PEM", workspace()).decision, "deny");
});

test("denies .env", () => {
  assert.equal(classifyWrite(".env", workspace()).decision, "deny");
});

test("denies nested Git internals", () => {
  assert.equal(classifyWrite(".GIT/config", workspace()).decision, "deny");
  assert.equal(classifyWrite("vendor/project/.git/config", workspace()).decision, "deny");
  assert.equal(classifyWrite("vendor/project/.GIT/config", workspace()).decision, "deny");
});

test("denies common credential files", () => {
  const root = workspace();
  assert.equal(classifyWrite(".npmrc", root).decision, "deny");
  assert.equal(classifyWrite(".docker/config.json", root).decision, "deny");
  assert.equal(classifyWrite("keys/id_ecdsa", root).decision, "deny");
});

test("reviews high-impact paths case-insensitively", () => {
  const root = workspace();
  assert.equal(classifyWrite("agents.md", root).decision, "ask");
  assert.equal(classifyWrite("DOCKERFILE", root).decision, "ask");
  assert.equal(classifyWrite(".GITHUB/WORKFLOWS/ci.yml", root).decision, "ask");
  assert.equal(classifyWrite("DEPLOY/prod.yaml", root).decision, "ask");
});

test("denies environment variants but allows the public example", () => {
  const root = workspace();
  assert.equal(classifyWrite(".env.production", root).decision, "deny");
  assert.equal(classifyWrite(".env.example", root).decision, "allow");
});

test("denies paths outside the workspace", () => {
  assert.equal(classifyWrite("../outside.txt", workspace()).decision, "deny");
});

test("denies a symlink escape", () => {
  const root = workspace();
  const outside = workspace();
  mkdirSync(join(root, "src"));
  symlinkSync(outside, join(root, "src", "external"));
  assert.equal(classifyWrite("src/external/file.txt", root).decision, "deny");
});
