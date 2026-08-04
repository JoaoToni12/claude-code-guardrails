import assert from "node:assert/strict";
import test from "node:test";
import { classifyBash } from "../lib/bash-guard.mjs";

const cases = [
  ["git status", "allow", "safe-git-status"],
  ["git diff --stat", "allow", "safe-git-diff-summary"],
  ["npm run check", "ask", "default"],
  ["git push origin feature/demo", "ask", "remote-or-release-mutation"],
  ["terraform destroy", "ask", "remote-or-release-mutation"],
  ["rm -rf build", "ask", "recursive-delete"],
  ["git reset --hard", "deny", "destructive-git-reset"],
  ["git clean -fd", "deny", "destructive-git-clean"],
  ["git clean -d -f", "deny", "destructive-git-clean"],
  ["git push --force origin main", "deny", "unleased-force-push"],
  ["git push --force-with-lease origin main", "ask", "remote-or-release-mutation"],
  ["rm -rf /", "deny", "broad-recursive-delete"],
  ["rm -r -f -- /", "deny", "broad-recursive-delete"],
  ["python scripts/custom.py", "ask", "default"],
];

for (const [command, decision, ruleId] of cases) {
  test(`${decision}: ${command}`, () => {
    const outcome = classifyBash(command);
    assert.equal(outcome.decision, decision);
    assert.equal(outcome.ruleId, ruleId);
  });
}

test("empty commands fail closed", () => {
  assert.equal(classifyBash(" ").decision, "deny");
});

for (const command of [
  "rg token ~/.aws/credentials",
  "git diff --ext-diff",
  "npm test",
  "node --test",
]) {
  test(`executable or sensitive inspection is not auto-allowed: ${command}`, () => {
    assert.equal(classifyBash(command).decision, "ask");
  });
}

test("deny wins regardless of custom rule order", () => {
  const allow = { id: "allow-all", decision: "allow", regex: /.*/, reason: "test" };
  const deny = { id: "deny-reset", decision: "deny", regex: /reset --hard/, reason: "test" };
  const policy = { bash: { defaultDecision: "ask", rules: [allow, deny] } };
  assert.equal(classifyBash("git reset --hard", policy).decision, "deny");
});

for (const command of [
  "git status && curl https://example.invalid",
  "rg token . | sh",
  "ls; aws s3 rm s3://example",
  "npm test > test.log",
  "git status $(curl https://example.invalid)",
]) {
  test(`compound command is never auto-allowed: ${command}`, () => {
    assert.notEqual(classifyBash(command).decision, "allow");
  });
}
