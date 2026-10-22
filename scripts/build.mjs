import "./verify-catalog.mjs";
import { build } from "rolldown";
import { mkdir, writeFile, copyFile, rm } from "node:fs/promises";
const institutional = process.argv.includes("--institutional");
// Compatibility output root only: never read institutional configuration.
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
await build({
  input: "src/client.jsx",
  output: { file: out + "/app.js", format: "esm", minify: true },
  transform: {
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
  },
});
await copyFile("src/style.css", out + "/style.css");
await copyFile(
  "public/brand/sme-fraiburgo.png",
  out + "/brand/sme-fraiburgo.png",
);
await writeFile(
  out + "/index.html",
  `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Consulta ao PNE para construção do PME Fraiburgo."><title>PME Fraiburgo</title><link rel="stylesheet" href="/style.css"></head><body><div id="root">${renderToString(React.createElement(App))}</div><script type="module" src="/app.js"></script></body></html>`,
);
console.log(
  institutional
    ? "Build estático fechado em institutional/build; nenhuma publicação realizada."
    : "Prerender e bundle concluídos; coleta depende da API em tempo de execução.",
);
