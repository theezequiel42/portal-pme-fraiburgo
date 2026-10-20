import test from "node:test";
import assert from "node:assert/strict";
import { handler } from "../scripts/preview.mjs";
test("política do preview: apenas arquivos dist permitidos, caminhos privados 404", async () => {
  for (const [url, status] of [
    ["/", 200],
    ["/app.js", 200],
    ["/style.css", 200],
    ["/brand/sme-fraiburgo.png", 200],
    ["/brand/fraiburgo.png", 404],
    ["/institutional/", 404],
    ["/.git/config", 404],
    ["/sources/", 404],
    ["/sources/numbered-rows.json", 404],
    ["/.aws/credentials", 404],
    ["/.env", 404],
    ["/package.json", 404],
    ["/%2e%2e/institutional/forms.json", 404],
  ]) {
    const res = {
      writeHead(code, headers) {
        this.status = code;
        this.headers = headers;
      },
      end(body) {
        this.body = body;
      },
    };
    await handler({ url, method: "GET" }, res);
    assert.equal(res.status, status, url);
  }
});
