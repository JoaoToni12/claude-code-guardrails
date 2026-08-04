import { classifyBash } from "../lib/bash-guard.mjs";

const scenarios = [
  ["Inspect changes", "git diff --stat"],
  ["Publish branch", "git push origin feature/guardrails"],
  ["Discard work", "git reset --hard"],
];

const rows = scenarios.map(([scenario, command]) => {
  const outcome = classifyBash(command);
  return { scenario, command, decision: outcome.decision, rule: outcome.ruleId };
});

console.table(rows);
