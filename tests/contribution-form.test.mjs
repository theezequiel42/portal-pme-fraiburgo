import test from "node:test";
import assert from "node:assert/strict";
import { build } from "rolldown";
import React from "react";
import { renderToString } from "react-dom/server";

test("formulário próprio: proposta obrigatória, opcionais e nenhum iframe", async () => {
  await build({
    input: "src/ContributionForm.jsx",
    external: (id) => /^react(?:\/|$)/.test(id),
    output: {
      file: "node_modules/.cache/contribution-test.mjs",
      format: "esm",
    },
  });
  const { ContributionForm } =
    await import("../node_modules/.cache/contribution-test.mjs");
  const html = renderToString(
    React.createElement(ContributionForm, {
      context: {
        group: "3 A",
        objective: "Objetivo 4",
        mode: "Geral",
        strategy: "",
      },
    }),
  );
  assert.match(html, /<form/);
  assert.match(html, /id="proposal"[^>]*required/);
  assert.match(html, /Problema \(opcional\)/);
  assert.match(html, /Justificativa \(opcional\)/);
  assert.doesNotMatch(html, /<iframe|docs.google.com/);
  assert.match(html, /Enviar contribuição/);
  assert.ok(html.indexOf('id="proposal"') < html.indexOf('id="problem"'));
  assert.match(html, /aria-describedby="proposal-help proposal-limit"/);
  assert.match(html, /Como seu envio é tratado/);
});
