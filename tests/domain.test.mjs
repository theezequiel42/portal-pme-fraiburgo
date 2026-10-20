import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { groups, contextFor, sameContext } from "../src/domain.js";
import { demoConfig, validateConfig, formUrl } from "../src/forms.js";
const catalog = JSON.parse(await readFile("data/pne-catalog.json"));
const source = JSON.parse(await readFile("sources/numbered-rows.json"));
const rows = catalog.objectives.flatMap((o) => [
  o,
  ...o.goals,
  ...o.strategies,
]);
test("464 rótulos, textos e posições exatamente iguais à fonte", () => {
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
});
test("todos os grupos exatos, contexto inválido bloqueado e modalidades completas", () => {
  assert.deepEqual(
    groups.map((g) => [g.id, g.objectives]),
    [
      ["1", [1, 2, 17]],
      ["2", [3, 17]],
      ["3 A", [4, 17]],
      ["3 B", [4, 17]],
      ["4", [5, 17]],
      ["5", [6, 17]],
      ["6", [7, 17]],
      ["7", [8]],
      ["8", [9, 17]],
      ["9", [10, 17]],
      ["10", [11, 17]],
      ["11", [12, 13, 17]],
      ["12", [14, 15, 16]],
      ["13", [18]],
      ["14", [19]],
    ],
  );
  for (const g of groups)
    for (const o of catalog.objectives) {
      assert.equal(
        !!contextFor(catalog, g.id, o.id, "Geral", ""),
        g.objectives.includes(o.id),
      );
      if (g.objectives.includes(o.id))
        for (const s of o.strategies)
          assert.ok(contextFor(catalog, g.id, o.id, "Estratégia", s.id));
    }
  assert.equal(contextFor(catalog, "1", 1, "Estratégia", ""), null);
  assert.equal(contextFor(catalog, "", 1, "Geral", ""), null);
  assert.equal(contextFor(catalog, "1", 1, "inválida", ""), null);
  assert.equal(
    sameContext(
      contextFor(catalog, "3 A", 4, "Geral", ""),
      contextFor(catalog, "3 B", 4, "Geral", ""),
    ),
    false,
  );
});
// Apenas fixture fictícia; não identifica um recurso Google real.
export const fixture = {
  enabled: true,
  approved: true,
  prefillVerified: true,
  responderUri:
    "https://docs.google.com/forms/d/e/FICTITIOUS_TEST_ONLY/viewform",
  verifiedNativePrefillUri:
    "https://docs.google.com/forms/d/e/FICTITIOUS_TEST_ONLY/viewform?entry.1=Test&entry.2=Test&entry.3=Geral&entry.4=Test",
  entries: {
    group: "entry.1",
    objective: "entry.2",
    mode: "entry.3",
    strategy: "entry.4",
  },
};
test("adaptador só habilita coleta com enabled booleano true", () => {
  assert.equal(validateConfig(fixture), true);
  for (const enabled of ["false", "true", 1, {}, [], false, null, undefined]) {
    const config = { ...fixture, enabled };
    assert.equal(validateConfig(config), false, `enabled: ${String(enabled)}`);
    assert.throws(() => formUrl(config, {}), /indisponível/);
  }
});
test("adaptador exige aprovação e prefill, restringe URL e codifica literalmente", () => {
  assert.equal(validateConfig(demoConfig), false);
  assert.throws(() => formUrl(demoConfig, {}));
  for (const change of [
    { approved: false },
    { prefillVerified: false },
    { verifiedNativePrefillUri: "https://evil.example/viewform" },
    { responderUri: "https://evil.example/forms/d/e/x/viewform" },
    { responderUri: "http://docs.google.com/forms/d/e/x/viewform" },
    { responderUri: fixture.responderUri + "?x=1" },
    { entries: { ...fixture.entries, mode: "entry.1" } },
  ])
    assert.equal(validateConfig({ ...fixture, ...change }), false);
  const c = {
    group: "A & B + ç",
    objective: "Objetivo? # /",
    mode: "Geral",
    strategy: "",
  };
  const url = new URL(formUrl(fixture, c));
  assert.equal(url.searchParams.get("embedded"), "true");
  for (const k in c)
    assert.equal(url.searchParams.get(fixture.entries[k]), c[k]);
});
test("prerender contém todas as linhas uma vez, sem iframe ou formulário falso", async () => {
  const html = await readFile("dist/index.html", "utf8");
  const unescape = (s) =>
    s
      .replace(/<!--.*?-->/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  const rendered = [
    ...html.matchAll(
      /<p data-legal="([^"]+)"><strong>[^<]+<\/strong>.*? — (.*?)<\/p>/g,
    ),
  ].map((m) => ({ label: unescape(m[1]), text: unescape(m[2]) }));
  assert.deepEqual(
    rendered,
    rows.map(({ label, text }) => ({ label, text })),
  );
  assert.equal(
    /<iframe|<textarea|entry\.[0-9]|FICTITIOUS_TEST_ONLY/.test(html),
    false,
  );
  const js = await readFile("dist/app.js", "utf8");
  assert.equal(
    /FICTITIOUS_TEST_ONLY|localStorage|sessionStorage|indexedDB/.test(js),
    false,
  );
});
