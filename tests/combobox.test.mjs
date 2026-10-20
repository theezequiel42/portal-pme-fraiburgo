import test from "node:test";
import assert from "node:assert/strict";
import { build } from "rolldown";
import React from "react";
import { renderToString } from "react-dom/server";
test("combobox SSR: label, ARIA e IDs consistentes, seleção inicialmente vazia", async () => {
  await build({
    input: "src/StrategyCombobox.jsx",
    external: (id) => /^react(?:\/|$)/.test(id),
    output: { file: "node_modules/.cache/combobox-test.mjs", format: "esm" },
  });
  const { StrategyCombobox } =
    await import("../node_modules/.cache/combobox-test.mjs");
  const html = renderToString(
    React.createElement(StrategyCombobox, {
      strategies: [],
      value: "",
      onChange() {},
    }),
  );
  assert.match(html, /role="combobox"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-autocomplete="list"/);
  assert.match(html, /placeholder="Digite uma palavra ou escolha na lista"/);
  assert.match(html, /value=""/);
  const control = html.match(/aria-controls="([^"]+)"/)[1];
  assert.ok(html.includes(`id="${control}"`));
  assert.match(html, /role="listbox"/);
  assert.doesNotMatch(html, /aria-activedescendant/);
});
