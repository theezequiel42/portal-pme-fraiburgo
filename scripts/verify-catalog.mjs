import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const catalog = JSON.parse(await readFile("data/pne-catalog.json"));
const source = JSON.parse(await readFile("sources/numbered-rows.json"));
const rows = catalog.objectives.flatMap((o) => [
  o,
  ...o.goals,
  ...o.strategies,
]);
assert.equal(rows.length, 464);
assert.equal(new Set(rows.map((r) => r.label)).size, 464);
assert.deepEqual(
  rows
    .map(({ label, text, sourceRow }) => ({ label, text, sourceRow }))
    .sort((a, b) => a.sourceRow - b.sourceRow),
  source,
);
assert.deepEqual(
  [
    catalog.objectives.length,
    catalog.objectives.flatMap((o) => o.goals).length,
    catalog.objectives.flatMap((o) => o.strategies).length,
  ],
  [19, 73, 372],
);
assert.equal(
  createHash("sha256")
    .update(await readFile("sources/lei-15388-camara.html"))
    .digest("hex"),
  catalog.source.sha256,
);
console.log(
  "Catálogo: 464 rótulos/textos/posições conferidos; SHA-256 da fonte confirmado.",
);
