import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("identidade SME: asset integral, cabeçalho acessível e paleta sem recorte municipal", async () => {
  const app = await readFile("src/App.jsx", "utf8");
  const css = await readFile("src/style.css", "utf8");
  const build = await readFile("scripts/build.mjs", "utf8");
  const preview = await readFile("scripts/preview.mjs", "utf8");
  const png = await readFile("public/brand/sme-fraiburgo.png");
  assert.equal(png.readUInt32BE(16), 7342);
  assert.equal(png.readUInt32BE(20), 1000);
  assert.match(app, /src="\/brand\/sme-fraiburgo.png"/);
  assert.match(app, /alt="Fraiburgo — Secretaria de Educação"/);
  const header = app.match(/<header>[\s\S]*?<\/header>/)?.[0];
  assert.ok(header);
  assert.doesNotMatch(header, /Secretaria Municipal de Educação/);
  assert.match(header, /alt="Fraiburgo — Secretaria de Educação"/);
  assert.match(
    app,
    /<footer>[\s\S]*?Município de Fraiburgo · Secretaria Municipal de Educação[\s\S]*?<\/footer>/,
  );
  for (const code of ["#a8518a", "#87396d", "#373435"])
    assert.ok(css.toLowerCase().includes(code), code);
  assert.doesNotMatch(
    css,
    /#(?:587e3c|df7835|4e2412|a72b2a|45652e|395625)|--green|overflow:\s*hidden|position:\s*absolute;\s*width:\s*193/i,
  );
  assert.match(css, /height: auto/);
  for (const script of [build, preview]) {
    assert.ok(script.includes("brand/sme-fraiburgo.png"));
    assert.ok(!script.includes('"brand/fraiburgo.png"'));
  }
});
