import { execFileSync } from "node:child_process";
import { mkdir, open, copyFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateConfig } from "../src/forms.js";

export async function runBuild({
  root = fileURLToPath(new URL("../", import.meta.url)),
  env = process.env,
} = {}) {
  const options = {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
  };
  if (env.VERCEL_ENV !== "production") {
    execFileSync("npm", ["run", "build"], options);
    return;
  }
  let config;
  try {
    config = JSON.parse(env.PME_FORMS_CONFIG);
  } catch {}
  if (!validateConfig(config))
    throw new Error(
      "PME_FORMS_CONFIG inválida: aprovação e prefill verificado obrigatórios.",
    );
  const privateRoot = join(root, "institutional");
  const configPath = join(privateRoot, "forms.json");
  await mkdir(privateRoot, { recursive: true });
  let handle;
  try {
    // Exclusive creation: never read, compare or overwrite a local configuration.
    handle = await open(configPath, "wx", 0o600);
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(
        "Configuração institucional existente; use um checkout limpo para produção.",
      );
    throw error;
  }
  try {
    await handle.writeFile(JSON.stringify(config));
    await handle.close();
    execFileSync(
      process.execPath,
      ["scripts/build.mjs", "--institutional"],
      options,
    );
    const output = join(root, "dist");
    await rm(output, { recursive: true, force: true });
    await mkdir(join(output, "brand"), { recursive: true });
    // Publish an explicit allowlist, never the institutional directory itself.
    for (const file of [
      "index.html",
      "app.js",
      "style.css",
      "brand/sme-fraiburgo.png",
    ])
      await copyFile(join(privateRoot, "build", file), join(output, file));
  } finally {
    try {
      await handle.close();
    } finally {
      await rm(configPath, { force: true });
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await runBuild();
