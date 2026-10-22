import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

async function request(handler, url, method = "GET") {
  const res = {
    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },
    end(body) {
      this.body = body;
    },
  };
  await handler({ url, method }, res);
  return res;
}

test("preview institucional isolado: raiz fixa, allowlist, métodos e headers", async () => {
  const root = await mkdtemp(join(tmpdir(), "pme-preview-"));
  try {
    await mkdir(join(root, "scripts"));
    await copyFile(
      new URL("../scripts/preview.mjs", import.meta.url),
      join(root, "scripts/preview.mjs"),
    );
    const preview = await import(
      pathToFileURL(join(root, "scripts/preview.mjs"))
    );
    assert.equal(typeof preview.createHandler, "function");
    for (const mode of ["/tmp", "../", "dist", {}, null, "institutional/build"])
      assert.throws(() => preview.createHandler(mode), /modo/i);
    for (const mode of ["demo", "institutional"]) {
      const res = await request(preview.createHandler(mode), "//[");
      assert.equal(res.status, 404, `${mode}: malformed target`);
      assert.equal(res.body, undefined);
    }
    const institutional = preview.createHandler("institutional");
    // Fresh clone: neither real configuration nor build is required.
    assert.equal((await request(institutional, "/")).status, 404);
    for (const [dir, marker] of [
      ["dist", "demo fixture"],
      ["institutional/build", "institutional fixture"],
    ]) {
      await mkdir(join(root, dir, "brand"), { recursive: true });
      for (const file of [
        "index.html",
        "app.js",
        "style.css",
        "brand/sme-fraiburgo.png",
      ])
        await writeFile(join(root, dir, file), marker);
    }
    for (const url of [
      "/",
      "/index.html",
      "/app.js",
      "/style.css",
      "/brand/sme-fraiburgo.png",
    ]) {
      const res = await request(institutional, url);
      assert.equal(res.status, 200);
      assert.equal(res.body.toString(), "institutional fixture");
      assert.deepEqual(
        res.headers,
        (await request(preview.handler, url)).headers,
      );
      assert.match(
        res.headers["Content-Security-Policy"],
        /connect-src 'self'/,
      );
      assert.equal((await request(institutional, url, "HEAD")).body, undefined);
      for (const method of ["POST", "PUT", "DELETE", "OPTIONS"])
        assert.equal((await request(institutional, url, method)).status, 404);
    }
    assert.equal(
      (await request(preview.createHandler(), "/")).body.toString(),
      "demo fixture",
    );
    for (const url of [
      "/institutional/",
      "/institutional/build/index.html",
      "/institutional/forms.json",
      "/forms.json",
      "/.git/config",
      "/sources/numbered-rows.json",
      "/.aws/credentials",
      "/.env",
      "/package.json",
      "/../forms.json",
      "/%2e%2e/institutional/forms.json",
      "/%2fapp.js",
      "/brand/fraiburgo.png",
    ])
      assert.equal((await request(institutional, url)).status, 404, url);
    await rm(join(root, "institutional/build/index.html"));
    assert.equal((await request(institutional, "/")).status, 404);
    assert.equal((await request(preview.handler, "/")).status, 200);
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(join(root, "scripts/preview.mjs"), "utf8"),
    );
    assert.match(source, /127\.0\.0\.1/);
    assert.match(source, /4173/);
    assert.equal(preview.parseMode([]), "demo");
    assert.equal(preview.parseMode(["--institutional"]), "institutional");
    for (const args of [
      ["--root", root],
      [root],
      ["--institutional", "--root=dist"],
      ["--institutional", "--institutional"],
    ])
      assert.throws(() => preview.parseMode(args));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
