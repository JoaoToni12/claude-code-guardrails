export async function readHookInput(stream = process.stdin) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  if (chunks.length === 0) throw new TypeError("hook input is empty");
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new TypeError("hook input must be a JSON object");
  }
  return parsed;
}

export function requirePreToolInput(input, expectedTools) {
  if (input.hook_event_name !== "PreToolUse") {
    throw new TypeError("expected a PreToolUse event");
  }
  if (!expectedTools.includes(input.tool_name)) {
    throw new TypeError(`unexpected tool: ${String(input.tool_name)}`);
  }
  if (!input.tool_input || typeof input.tool_input !== "object") {
    throw new TypeError("tool_input must be an object");
  }
  return input;
}

export function preToolDecision(decision, reason) {
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  };
}

export function postToolContext(message) {
  return {
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: message,
    },
  };
}

export function writeJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value)}\n`);
}
