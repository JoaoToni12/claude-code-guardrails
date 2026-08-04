import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCAN_DIRS = ["hooks", "lib", "scripts", "test"];

function collectMjs(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return collectMjs(path);
    return entry.isFile() && path.endsWith(".mjs") ? [path] : [];
  });
}

const files = SCAN_DIRS.flatMap((directory) => collectMjs(join(ROOT, directory)));
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
  if (!statSync(file).isFile()) process.exit(1);
}

process.stdout.write(`syntax verified: ${files.length} modules\n`);
