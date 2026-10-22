import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { build } from "rolldown";
test("árvore inicial consistente: nenhum grupo, etapas dependentes ausentes e fallback disponível", async () => {
  // Build fixtures share node_modules, so never import their mutable SSR cache.
  await build({
    input: "src/App.jsx",
    external: (id) => /^react(?:-dom)?(?:\/|$)/.test(id),
    output: { file: "node_modules/.cache/components-test.mjs", format: "esm" },
  });
  const { App } = await import("../node_modules/.cache/components-test.mjs");
  const html = renderToString(React.createElement(App));
  assert.match(html, /Selecione uma área/);
  assert.match(html, /<select id="group" disabled=""/);
  assert.doesNotMatch(html, /id="objective"|id="strategy"|<iframe|<textarea/);
  assert.match(html, /<details class="catalog"/);
  assert.match(html, /fluxo interativo precisa de JavaScript/);
  assert.equal((html.match(/data-legal=/g) || []).length, 464);
  assert.match(html, /aria-label="Etapas da participação"/);
  assert.match(html, /1\. Escolha o assunto/);
  assert.match(html, /2\. Consulte o conteúdo/);
  assert.match(html, /3\. Escreva sua contribuição/);
  assert.match(html, /Escolha um grupo de trabalho e um objetivo para consultar/);
});
