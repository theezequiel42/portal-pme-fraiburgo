import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  open,
  cp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
  readdir,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repo = new URL("../", import.meta.url);
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

test("Vercel non-production always builds closed demo ignoring env and local config", async (t) => {
  const { runBuild } = await import("../scripts/vercel-build.mjs");
  const root = await fixture(t);
  await mkdir(join(root, "institutional"));
  const sentinel = "PRIVATE_SYNTHETIC_SENTINEL";
  await writeFile(join(root, "institutional/forms.json"), sentinel);
  for (const mode of ["preview", "development", undefined]) {
    await runBuild({
      root,
      env: { VERCEL_ENV: mode, PME_FORMS_CONFIG: "INVALID_IGNORED" },
    });
    assert.equal(
      await readFile(join(root, "institutional/forms.json"), "utf8"),
      sentinel,
    );
    assert.match(
      await readFile(join(root, "dist/index.html"), "utf8"),
      /Coleta ainda não aberta/,
    );
    assert.doesNotMatch(
      await readFile(join(root, "dist/app.js"), "utf8"),
      /PRIVATE_SYNTHETIC_SENTINEL|TEST_FIXTURE/,
    );
    assert.doesNotMatch(
      await readFile(join(root, "dist/index.html"), "utf8"),
      /<iframe/,
    );
  }
});

test("Vercel production rejects missing, malformed or unapproved config without exposing values", async (t) => {
  const { runBuild } = await import("../scripts/vercel-build.mjs");
  const root = await fixture(t);
  for (const value of [
    undefined,
    "PRIVATE_SYNTHETIC_INVALID",
    "null",
    "{}",
    JSON.stringify({ enabled: true }),
  ]) {
    await assert.rejects(
      runBuild({
        root,
        env: { VERCEL_ENV: "production", PME_FORMS_CONFIG: value },
      }),
      /PME_FORMS_CONFIG inválida/,
    );
  }
  await assert.rejects(readFile(join(root, "institutional/forms.json")), {
    code: "ENOENT",
  });
  await assert.rejects(readFile(join(root, "dist/index.html")), {
    code: "ENOENT",
  });
});

// Deliberately synthetic: never copy institutional links or entry IDs here.
const synthetic = {
  enabled: true,
  approved: true,
  prefillVerified: true,
  responderUri: "https://docs.google.com/forms/d/e/TEST_FIXTURE/viewform",
  verifiedNativePrefillUri:
    "https://docs.google.com/forms/d/e/TEST_FIXTURE/viewform?entry.1=A&entry.2=B&entry.3=C&entry.4=D",
  entries: {
    group: "entry.1",
    objective: "entry.2",
    mode: "entry.3",
    strategy: "entry.4",
  },
};
const production = {
  VERCEL_ENV: "production",
  PME_FORMS_CONFIG: JSON.stringify(synthetic),
};

test("Vercel production builds institutional fixture and publishes only public assets", async (t) => {
  const { runBuild } = await import("../scripts/vercel-build.mjs");
  const root = await fixture(t);
  await mkdir(join(root, "institutional"));
  await writeFile(
    join(root, "institutional/private.txt"),
    "PRIVATE_SYNTHETIC_SENTINEL",
  );
  await runBuild({ root, env: production });
  assert.match(
    await readFile(join(root, "dist/app.js"), "utf8"),
    /TEST_FIXTURE/,
  );
  assert.doesNotMatch(
    await readFile(join(root, "dist/index.html"), "utf8"),
    /Coleta ainda não aberta/,
  );
  assert.deepEqual(
    (await readdir(join(root, "dist"), { recursive: true })).sort(),
    ["app.js", "brand", "brand/sme-fraiburgo.png", "index.html", "style.css"],
  );
  assert.equal(
    await readFile(join(root, "institutional/private.txt"), "utf8"),
    "PRIVATE_SYNTHETIC_SENTINEL",
  );
  await assert.rejects(readFile(join(root, "institutional/forms.json")), {
    code: "ENOENT",
  });
});

test("Vercel production removes temporary config even when closing its handle rejects", async (t) => {
  const { runBuild } = await import("../scripts/vercel-build.mjs");
  const root = await fixture(t);
  const probe = await open(join(root, "probe"), "w");
  const prototype = Object.getPrototypeOf(probe);
  const write = prototype.writeFile;
  await probe.close();
  const failure = new Error("Synthetic close failure");
  t.mock.method(prototype, "writeFile", async function (...args) {
    const close = this.close;
    t.mock.method(this, "close", async function () {
      await close.call(this);
      throw failure;
    });
    return write.apply(this, args);
  });

  await assert.rejects(runBuild({ root, env: production }), (error) => {
    assert.equal(error, failure);
    return true;
  });
  await assert.rejects(readFile(join(root, "institutional/forms.json")), {
    code: "ENOENT",
  });
});

test("Vercel production removes temporary config when the institutional build fails", async (t) => {
  const { runBuild } = await import("../scripts/vercel-build.mjs");
  const root = await fixture(t);
  await writeFile(join(root, "scripts/build.mjs"), "process.exit(23);\n");

  await assert.rejects(runBuild({ root, env: production }), (error) => {
    assert.equal(error.status, 23);
    return true;
  });
  await assert.rejects(readFile(join(root, "institutional/forms.json")), {
    code: "ENOENT",
  });
  await assert.rejects(readFile(join(root, "dist/index.html")), {
    code: "ENOENT",
  });
});

test("Vercel production refuses existing config without reading or overwriting it", async (t) => {
  const { runBuild } = await import("../scripts/vercel-build.mjs");
  const root = await fixture(t);
  await mkdir(join(root, "institutional"));
  await writeFile(
    join(root, "institutional/forms.json"),
    "PRIVATE_SYNTHETIC_SENTINEL",
    { mode: 0o000 },
  );
  t.after(() =>
    import("node:fs/promises")
      .then(({ chmod }) => chmod(join(root, "institutional/forms.json"), 0o600))
      .catch(() => {}),
  );
  await assert.rejects(
    runBuild({ root, env: production }),
    /Configuração institucional existente/,
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
