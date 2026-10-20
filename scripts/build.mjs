import "./verify-catalog.mjs";
import { build } from "rolldown";
import { mkdir, writeFile, copyFile, rm, readFile } from "node:fs/promises";
import { demoConfig, validateConfig } from "../src/forms.js";
const institutional = process.argv.includes("--institutional");
const config = institutional
  ? JSON.parse(await readFile("institutional/forms.json", "utf8"))
  : demoConfig;
if (institutional && !validateConfig(config))
  throw new Error("Aprovação e evidência de prefill nativo obrigatórias.");
// O build demonstrativo jamais lê configuração institucional.
const out = institutional ? "institutional/build" : "dist";
await rm(out, { recursive: true, force: true });
await mkdir(out + "/brand", { recursive: true });
await build({
  input: "src/App.jsx",
  external: (id) => /^react(?:-dom)?(?:\/|$)/.test(id),
  output: { file: "node_modules/.cache/pme-ssr.mjs", format: "esm" },
});
const { App } = await import(
  "../node_modules/.cache/pme-ssr.mjs?" + Date.now()
);
const React = await import("react");
const { renderToString } = await import("react-dom/server");
let input = "src/client.jsx";
if (institutional) {
  input = "institutional/client.generated.jsx";
  await writeFile(
    input,
    `import React from 'react';import {hydrateRoot} from 'react-dom/client';import {App} from '../src/App.jsx';hydrateRoot(document.getElementById('root'),<App config={${JSON.stringify(config).replace(/</g, "\\u003c")}}/>);`,
  );
}
try {
  await build({
    input,
    output: { file: out + "/app.js", format: "esm", minify: true },
    transform: {
      define: { "process.env.NODE_ENV": JSON.stringify("production") },
    },
  });
} finally {
  if (institutional) await rm(input, { force: true });
}
await copyFile("src/style.css", out + "/style.css");
await copyFile(
  "public/brand/sme-fraiburgo.png",
  out + "/brand/sme-fraiburgo.png",
);
await writeFile(
  out + "/index.html",
  `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Consulta ao PNE para construção do PME Fraiburgo."><title>PME Fraiburgo</title><link rel="stylesheet" href="/style.css"></head><body><div id="root">${renderToString(React.createElement(App, { config }))}</div><script type="module" src="/app.js"></script></body></html>`,
);
console.log(
  institutional
    ? "Build institucional privado concluído; nenhuma publicação realizada."
    : "Prerender e bundle demonstrativo concluídos; coleta desabilitada.",
);
