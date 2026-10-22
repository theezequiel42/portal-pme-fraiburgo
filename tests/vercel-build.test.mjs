import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  cp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
  readdir,
  chmod,
  stat,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repo = new URL("../", import.meta.url);
const assets = [
  "app.js",
  "brand",
  "brand/sme-fraiburgo.png",
  "index.html",
  "style.css",
];
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "pme-vercel-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of [
    "src",
    "scripts",
    "data",
    "sources",
    "public",
    "package.json",
  ])
    await cp(new URL(name, repo), join(root, name), { recursive: true });
  await symlink(
    new URL("node_modules", repo).pathname,
    join(root, "node_modules"),
  );
  return root;
}
async function assertClosed(root, output = "dist") {
  const html = await readFile(join(root, output, "index.html"), "utf8");
  const js = await readFile(join(root, output, "app.js"), "utf8");
  assert.match(html, /Coleta ainda não aberta/);
  assert.doesNotMatch(html, /<iframe/);
  assert.doesNotMatch(
    html + js,
    /PRIVATE_SYNTHETIC|TEST_FIXTURE|synthetic-private-key/,
  );
  assert.deepEqual(
    (await readdir(join(root, output), { recursive: true })).sort(),
    assets,
  );
}

test("all Vercel environments build closed assets ignoring legacy config and backend secrets", async (t) => {
  const { runBuild } = await import("../scripts/vercel-build.mjs");
  const root = await fixture(t);
  await mkdir(join(root, "institutional"));
  const privatePath = join(root, "institutional/forms.json");
  await writeFile(privatePath, "PRIVATE_SYNTHETIC_SENTINEL", { mode: 0o000 });
  const before = await stat(privatePath);
  for (const mode of ["production", "preview", "development", undefined]) {
    await runBuild({
      root,
      env: {
        VERCEL_ENV: mode,
        PME_FORMS_CONFIG: "PRIVATE_SYNTHETIC_INVALID",
        COLLECTION_ENABLED: "true",
        COLLECTION_ORIGIN: "https://PRIVATE_SYNTHETIC.example",
        GOOGLE_SERVICE_ACCOUNT_EMAIL: "PRIVATE_SYNTHETIC@example.invalid",
        GOOGLE_PRIVATE_KEY: "synthetic-private-key",
        GOOGLE_SHEETS_ID: "PRIVATE_SYNTHETIC_SHEET",
      },
    });
    await assertClosed(root);
  }
  const after = await stat(privatePath);
  assert.equal(after.atimeMs, before.atimeMs);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.deepEqual(await readdir(join(root, "institutional")), ["forms.json"]);
  await chmod(privatePath, 0o600);
  assert.equal(
    await readFile(privatePath, "utf8"),
    "PRIVATE_SYNTHETIC_SENTINEL",
  );
});

test("production needs no build-time config and creates no institutional directory", async (t) => {
  const { runBuild } = await import("../scripts/vercel-build.mjs");
  const root = await fixture(t);
  await runBuild({
    root,
    env: { VERCEL_ENV: "production", PME_FORMS_CONFIG: undefined },
  });
  await assertClosed(root);
  await assert.rejects(stat(join(root, "institutional")), { code: "ENOENT" });
});

test("Vercel propagates build failure without creating a private configuration", async (t) => {
  const { runBuild } = await import("../scripts/vercel-build.mjs");
  const root = await fixture(t);
  await writeFile(join(root, "scripts/build.mjs"), "process.exit(23);\n");
  await assert.rejects(
    runBuild({ root, env: { VERCEL_ENV: "production" } }),
    (error) => {
      assert.equal(error.status, 23);
      return true;
    },
  );
  await assert.rejects(stat(join(root, "institutional")), { code: "ENOENT" });
  await assert.rejects(stat(join(root, "dist")), { code: "ENOENT" });
});

test("institutional and default builds never read or modify private config and never pass App config", async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, "institutional"));
  const config = join(root, "institutional/forms.json");
  await writeFile(config, "PRIVATE_SYNTHETIC_SENTINEL", { mode: 0o000 });
  const before = await stat(config);
  // This fixture enforces the new App interface and catches build-time props.
  await writeFile(
    join(root, "src/App.jsx"),
    `import React from 'react'; export function App(props) { if (Object.hasOwn(props, 'config')) throw new Error('App no longer accepts config'); return <p>Coleta ainda não aberta</p>; }`,
  );
  await writeFile(
    join(root, "src/client.jsx"),
    `import React from 'react'; import {hydrateRoot} from 'react-dom/client'; import {App} from './App.jsx'; hydrateRoot(document.getElementById('root'), <App/>);`,
  );
  await writeFile(
    join(root, "src/forms.js"),
    "export const demoConfig = {}; export const validateConfig = () => true; throw new Error('Legacy config module must not be imported');",
  );
  for (const args of [
    ["scripts/build.mjs"],
    ["scripts/build.mjs", "--institutional"],
  ]) {
    execFileSync(process.execPath, args, { cwd: root, stdio: "pipe" });
    await assertClosed(
      root,
      args.length === 1 ? "dist" : "institutional/build",
    );
  }
  const after = await stat(config);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.equal(after.atimeMs, before.atimeMs);
  await chmod(config, 0o600);
  assert.equal(await readFile(config, "utf8"), "PRIVATE_SYNTHETIC_SENTINEL");
  assert.deepEqual((await readdir(join(root, "institutional"))).sort(), [
    "build",
    "forms.json",
  ]);
  for (const file of assets.filter((file) => file !== "brand"))
    assert.deepEqual(
      await readFile(join(root, "dist", file)),
      await readFile(join(root, "institutional/build", file)),
    );
});

test("Vercel static settings preserve preview security headers and required build sources", async () => {
  const settings = JSON.parse(
    await readFile(new URL("vercel.json", repo), "utf8"),
  );
  assert.equal(settings.buildCommand, "node scripts/vercel-build.mjs");
  assert.equal(settings.installCommand, "npm ci");
  assert.equal(settings.outputDirectory, "dist");
  assert.equal(settings.framework, null);
  const headers = Object.fromEntries(
    settings.headers
      .find(({ source }) => source === "/(.*)")
      .headers.map(({ key, value }) => [key, value]),
  );
  const { handler } = await import("../scripts/preview.mjs");
  let previewHeaders;
  await handler(
    { url: "/", method: "HEAD" },
    {
      writeHead(status, value) {
        assert.equal(status, 200);
        previewHeaders = value;
      },
      end() {},
    },
  );
  for (const key of [
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "Referrer-Policy",
  ])
    assert.equal(headers[key], previewHeaders[key]);
  assert.equal(headers["X-Frame-Options"], "DENY");
  const ignored = (
    await readFile(new URL(".vercelignore", repo), "utf8")
  ).split(/\r?\n/);
  for (const path of [
    "institutional/",
    ".git/",
    ".env*",
    "credentials/",
    "test-results/",
    "playwright-report/",
  ])
    assert.ok(ignored.includes(path));
  assert.ok(!ignored.includes("sources/"));
  assert.match(
    await readFile(new URL(".gitignore", repo), "utf8"),
    /^\.vercel\/$/m,
  );
});
