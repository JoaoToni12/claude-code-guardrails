import { existsSync, realpathSync } from "node:fs";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";
import { loadPolicy } from "./policy.mjs";

function isWithin(root, target) {
  const offset = relative(root, target);
  return offset === "" || (!offset.startsWith(`..${sep}`) && offset !== "..");
}

function nearestExisting(path) {
  let cursor = path;
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return cursor;
}

export function classifyWrite(requestedPath, projectRoot, policy = loadPolicy()) {
  if (typeof requestedPath !== "string" || requestedPath.length === 0 || requestedPath.includes("\0")) {
    return result("deny", "invalid-path", "Write target must be a non-empty filesystem path.");
  }

  const root = realpathSync(projectRoot);
  const target = resolve(root, requestedPath);
  const realAncestor = realpathSync(nearestExisting(target));
  if (!isWithin(root, target) || !isWithin(root, realAncestor)) {
    return result("deny", "outside-workspace", "Refusing a write outside the active workspace.");
  }

  const relativePath = relative(root, target).split(sep).join("/");
  const normalizedRelativePath = relativePath.toLowerCase();
  const name = basename(target);
  const normalizedName = name.toLowerCase();
  const write = policy.write;
  if (normalizedRelativePath.split("/").includes(".git")) {
    return result("deny", "git-internals", "Git internals must not be edited through a file tool.");
  }
  const deniedPrefix = write.denyPrefixes.some((prefix) => normalizedName.startsWith(prefix));
  const allowedName = write.allowBasenames.includes(normalizedName);
  const deniedPath = write.denyPaths.includes(normalizedRelativePath);
  if (deniedPath || write.denyBasenames.includes(normalizedName) || write.denyExtensions.includes(extname(normalizedName)) || (deniedPrefix && !allowedName)) {
    return result("deny", "sensitive-file", "The target resembles a credential or private-key file.");
  }
  const reviewName = write.reviewBasenames.some((item) => item.toLowerCase() === normalizedName);
  const reviewPath = write.reviewPrefixes.some((prefix) => normalizedRelativePath.startsWith(prefix.toLowerCase()));
  if (reviewName || reviewPath) {
    return result("ask", "high-impact-config", "This path controls agents, CI, deployment, or schema changes.");
  }
  return result("allow", "workspace-source", "The target is a regular file inside the active workspace.");
}

function result(decision, ruleId, reason) {
  return Object.freeze({ decision, ruleId, reason });
}
