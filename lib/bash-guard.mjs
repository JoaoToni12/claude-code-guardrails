import { loadPolicy } from "./policy.mjs";

const SHELL_CONTROL = /[;&|`<>\n\r]|\$\(/;
const SEVERITY = Object.freeze({ allow: 1, ask: 2, deny: 3 });

function strongestMatch(rules, command, minimum = 1) {
  return rules
    .filter((rule) => SEVERITY[rule.decision] >= minimum && rule.regex.test(command))
    .reduce((strongest, rule) => {
      if (!strongest || SEVERITY[rule.decision] > SEVERITY[strongest.decision]) return rule;
      return strongest;
    }, null);
}

export function classifyBash(command, policy = loadPolicy()) {
  if (typeof command !== "string" || command.trim().length === 0) {
    return Object.freeze({
      decision: "deny",
      ruleId: "invalid-command",
      reason: "Bash command must be a non-empty string.",
    });
  }

  const normalized = command.replace(/\s+/g, " ").trim();
  const matched = strongestMatch(policy.bash.rules, normalized, SEVERITY.ask);
  if (matched) {
    return Object.freeze({
      decision: matched.decision,
      ruleId: matched.id,
      reason: matched.reason,
    });
  }

  if (SHELL_CONTROL.test(command)) {
    return Object.freeze({
      decision: "ask",
      ruleId: "compound-command",
      reason: "Compound commands and shell control operators require review.",
    });
  }

  const allowRule = strongestMatch(policy.bash.rules, normalized);
  if (allowRule) {
    return Object.freeze({
      decision: "allow",
      ruleId: allowRule.id,
      reason: allowRule.reason,
    });
  }

  return Object.freeze({
    decision: policy.bash.defaultDecision,
    ruleId: "default",
    reason: "The command is not classified; review it before execution.",
  });
}
