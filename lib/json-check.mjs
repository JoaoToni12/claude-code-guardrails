import { readFileSync, realpathSync, statSync } from "node:fs";
import { extname, relative, resolve, sep } from "node:path";

const MAX_JSON_BYTES = 1_048_576;

function isWithin(root, target) {
  const offset = relative(root, target);
  return offset === "" || (!offset.startsWith(`..${sep}`) && offset !== "..");
}

export function validateJsonFile(filePath, projectRoot) {
  if (typeof filePath !== "string" || extname(filePath).toLowerCase() !== ".json") {
    return Object.freeze({ status: "not-applicable" });
  }
  try {
    const root = realpathSync(projectRoot);
    const target = realpathSync(resolve(root, filePath));
    if (!isWithin(root, target)) return invalid("JSON target resolves outside the workspace.");
    if (statSync(target).size > MAX_JSON_BYTES) return invalid("JSON validation limit is 1 MiB.");
    JSON.parse(readFileSync(target, "utf8"));
    return Object.freeze({ status: "valid" });
  } catch (error) {
    if (error instanceof SyntaxError) return invalid("JSON is not valid; repair it and rerun verification.");
    return invalid("JSON validation could not safely read the target file.");
  }
}

function invalid(message) {
  return Object.freeze({ status: "invalid", message });
}
