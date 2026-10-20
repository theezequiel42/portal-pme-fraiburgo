import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { App } from "../node_modules/.cache/pme-ssr.mjs";
test("árvore inicial consistente: nenhum grupo, etapas dependentes ausentes e fallback disponível", () => {
  const html = renderToString(React.createElement(App));
  assert.match(html, /Selecione uma área/);
  assert.match(html, /<select id="group" disabled=""/);
  assert.doesNotMatch(html, /id="objective"|id="strategy"|<iframe|<textarea/);
  assert.match(html, /<details class="catalog"/);
  assert.match(html, /fluxo interativo precisa de JavaScript/);
  assert.equal((html.match(/data-legal=/g) || []).length, 464);
});
