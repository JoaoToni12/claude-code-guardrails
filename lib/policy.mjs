import { readFileSync } from "node:fs";

const POLICY_URL = new URL("../config/policy.json", import.meta.url);
const DECISIONS = new Set(["allow", "ask", "deny"]);

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function compileRule(rule, index) {
  const label = `bash.rules[${index}]`;
  const decision = requireString(rule?.decision, `${label}.decision`);
  if (!DECISIONS.has(decision)) throw new TypeError(`${label}.decision is invalid`);
  return Object.freeze({
    id: requireString(rule?.id, `${label}.id`),
    decision,
    regex: new RegExp(requireString(rule?.pattern, `${label}.pattern`), "i"),
    reason: requireString(rule?.reason, `${label}.reason`),
  });
}

function freezeWritePolicy(write) {
  const keys = [
    "allowBasenames",
    "denyBasenames",
    "denyExtensions",
    "denyPaths",
    "denyPrefixes",
    "reviewPrefixes",
    "reviewBasenames",
  ];
  const entries = keys.map((key) => {
    if (!Array.isArray(write?.[key])) throw new TypeError(`write.${key} must be an array`);
    return [key, Object.freeze(write[key].map((item) => requireString(item, `write.${key}`)))];
  });
  return Object.freeze(Object.fromEntries(entries));
}

export function parsePolicy(raw) {
  const value = JSON.parse(raw);
  if (value?.version !== 1) throw new TypeError("policy.version must be 1");
  if (!DECISIONS.has(value?.bash?.defaultDecision)) {
    throw new TypeError("bash.defaultDecision is invalid");
  }
  return Object.freeze({
    version: value.version,
    bash: Object.freeze({
      defaultDecision: value.bash.defaultDecision,
      rules: Object.freeze(value.bash.rules.map(compileRule)),
    }),
    write: freezeWritePolicy(value.write),
  });
}

export function loadPolicy(path = process.env.AI_BUILDER_POLICY_PATH) {
  const source = path ? readFileSync(path, "utf8") : readFileSync(POLICY_URL, "utf8");
  return parsePolicy(source);
}
