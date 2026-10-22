import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export async function runBuild({
  root = fileURLToPath(new URL("../", import.meta.url)),
  env = process.env,
} = {}) {
  // Every deployment uses identical closed static assets. Collection status and
  // Google credentials belong exclusively to the runtime Node API.
  execFileSync(process.execPath, ["scripts/build.mjs"], {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await runBuild();
