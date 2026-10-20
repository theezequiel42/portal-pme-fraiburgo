import http from "node:http";
import { readFile } from "node:fs/promises";
const files = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/app.js", "app.js"],
  ["/style.css", "style.css"],
  ["/brand/sme-fraiburgo.png", "brand/sme-fraiburgo.png"],
]);
const types = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  png: "image/png",
};
export function parseMode(args) {
  if (args.length === 0) return "demo";
  if (args.length === 1 && args[0] === "--institutional")
    return "institutional";
  throw new Error(
    "Use preview.mjs [--institutional]; raiz arbitrária não permitida.",
  );
}
export function createHandler(mode = "demo") {
  if (mode !== "demo" && mode !== "institutional")
    throw new Error("Modo de preview inválido.");
  const root = new URL(
    mode === "institutional" ? "../institutional/build/" : "../dist/",
    import.meta.url,
  );
  return async function handler(req, res) {
    const path = new URL(req.url, "http://localhost").pathname;
    const file = files.get(path);
    if (!file || !["GET", "HEAD"].includes(req.method)) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const data = await readFile(new URL(file, root));
      res.writeHead(200, {
        "Content-Type": types[file.split(".").pop()],
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; frame-src https://docs.google.com; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
        "Referrer-Policy": "no-referrer",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  };
}
export const handler = createHandler();
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const mode = parseMode(process.argv.slice(2));
  http
    .createServer(createHandler(mode))
    .listen(4173, "127.0.0.1", () =>
      console.log(`Preview ${mode}: http://127.0.0.1:4173`),
    );
}
