import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, createPublicKey, verify } from "node:crypto";
import { Readable } from "node:stream";
import { readFile } from "node:fs/promises";
import { contextFor } from "../src/domain.js";
const catalog = JSON.parse(
  await readFile(new URL("../data/pne-catalog.json", import.meta.url)),
);
const payload = () => ({
  requestId: "a0000000-0000-4000-8000-000000000001",
  context: contextFor(catalog, "1", 1, "Geral", ""),
  problem: "",
  proposal: "=1+1\nAção pública",
  justification: "",
  website: "",
});

const privateKey = generateKeyPairSync("rsa", {
  modulusLength: 2048,
}).privateKey.export({ type: "pkcs8", format: "pem" });
const env = {
  VERCEL_ENV: "production",
  COLLECTION_ENABLED: "true",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "fixture@example.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: privateKey,
  GOOGLE_SHEETS_ID: "FICTITIOUS_TEST_ONLY",
  COLLECTION_ORIGIN: "https://portal.example",
};
async function backend(options = {}) {
  return (await import("../server/contributions.mjs")).createHandlers({
    env,
    ...options,
  });
}
async function call(handler, body, headers = {}, method = "POST") {
  const req = Readable.from(
    body === undefined
      ? []
      : [typeof body === "string" ? body : JSON.stringify(body)],
  );
  Object.assign(req, {
    method,
    headers: {
      origin: env.COLLECTION_ORIGIN,
      "content-type": "application/json",
      ...headers,
    },
  });
  const res = {
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(text) {
      this.body = JSON.parse(text);
    },
  };
  await handler(req, res);
  return res;
}
test("collection fails closed unless every server setting is valid; never contacts Google", async () => {
  let calls = 0;
  for (const key of Object.keys(env)) {
    const handlers = await backend({
      env: { ...env, [key]: "" },
      fetch: async () => {
        calls++;
      },
    });
    const result = await call(handlers.collection, undefined, {}, "GET");
    assert.deepEqual(result.body, { enabled: false });
    assert.equal((await call(handlers.contributions, {})).statusCode, 503);
  }
  assert.equal(calls, 0);
  assert.deepEqual(
    (await call((await backend()).collection, undefined, {}, "GET")).body,
    { enabled: true },
  );
});
const HEADERS = [
  "Recebido em (Brasília)",
  "Grupo de trabalho",
  "Objetivo",
  "Modalidade",
  "Estratégia",
  "Problema",
  "Proposta",
  "Justificativa",
  "Protocolo",
];
function expectedFields(body) {
  return [
    body.context.group,
    body.context.objective,
    body.context.mode,
    body.context.strategy,
    body.problem,
    body.proposal,
    body.justification,
    body.requestId,
  ];
}
function fakeGoogle() {
  const rows = [HEADERS.slice()];
  const metadata = new Map();
  const tabs = new Map([["Contribuições", rows]]);
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url, ...options });
    const result = (body, status = 200) => ({
      ok: status < 300,
      status,
      json: async () => body,
    });
    if (url === "https://oauth2.googleapis.com/token")
      return result({ access_token: "fake-token", expires_in: 3600 });
    assert.ok(
      url.startsWith(
        "https://sheets.googleapis.com/v4/spreadsheets/FICTITIOUS_TEST_ONLY",
      ),
    );
    assert.equal(options.headers.Authorization, "Bearer fake-token");
    if (url.endsWith(":batchUpdate")) {
      const { requests } = JSON.parse(options.body);
      assert.equal(requests.length, 3);
      assert.deepEqual(requests[2], {
        autoResizeDimensions: {
          dimensions: { sheetId: 42, dimension: "ROWS", startIndex: 1 },
        },
      });
      const claim = requests[0].createDeveloperMetadata.developerMetadata;
      const append = requests[1].appendCells;
      assert.deepEqual(claim.location, { spreadsheet: true });
      assert.equal(claim.visibility, "DOCUMENT");
      assert.equal(claim.metadataKey, "pme_request");
      assert.equal(append.sheetId, 42);
      assert.equal(append.fields, "userEnteredValue");
      assert.equal(append.rows.length, 1);
      const values = append.rows[0].values.map((cell) => {
        assert.deepEqual(Object.keys(cell), ["userEnteredValue"]);
        assert.deepEqual(Object.keys(cell.userEnteredValue), ["stringValue"]);
        assert.equal(typeof cell.userEnteredValue.stringValue, "string");
        return cell.userEnteredValue.stringValue;
      });
      assert.equal(values.length, 9);
      if (metadata.has(claim.metadataId)) return result({}, 400);
      metadata.set(claim.metadataId, claim);
      rows.push(values);
      return result({ replies: [{}, {}, {}] });
    }
    if (url.includes("/values/")) {
      assert.equal(options.method, "GET");
      const range = decodeURIComponent(url.split("/values/")[1].split("?")[0]);
      assert.match(range, /^'Contribuições'!A1:I\d+$/);
      const end = Number(range.split("I")[1]);
      return result({ values: rows.slice(0, end).map((row) => row.slice()) });
    }
    assert.equal(
      new URL(url).searchParams.get("fields"),
      "sheets(properties(sheetId,title)),developerMetadata(metadataId,metadataKey,metadataValue)",
    );
    return result({
      sheets: [...tabs.keys()].map((title) => ({
        properties: { title, sheetId: 42 },
      })),
      developerMetadata: [...metadata.values()],
    });
  };
  return { tabs, rows, metadata, calls, fetch };
}
test("official JWT transport writes literal cells once and acknowledges only exact readback; fresh handler deduplicates durably", async () => {
  const google = fakeGoogle();
  const body = payload();
  const result = await call(
    (await backend({ fetch: google.fetch })).contributions,
    body,
  );
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, {
    receipt: body.requestId,
    status: "recorded",
  });
  assert.deepEqual(google.rows[1].slice(1), expectedFields(body));
  assert.match(google.rows[1][0], /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  const originalTimestamp = google.rows[1][0];
  const again = await call(
    (await backend({ fetch: google.fetch })).contributions,
    body,
  );
  assert.deepEqual(again.body, result.body);
  assert.equal(google.rows[1][0], originalTimestamp);
  assert.equal(
    google.calls.filter((c) => c.url.endsWith(":batchUpdate")).length,
    1,
  );
  assert.equal(
    (
      await call((await backend({ fetch: google.fetch })).contributions, {
        ...body,
        proposal: "different",
      })
    ).statusCode,
    409,
  );
  const token = google.calls.find((c) => c.url.includes("oauth2")).body;
  const jwt = new URLSearchParams(token).get("assertion");
  const claims = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url"));
  assert.equal(claims.scope, "https://www.googleapis.com/auth/spreadsheets");
  assert.equal(claims.aud, "https://oauth2.googleapis.com/token");
  assert.equal(claims.iss, env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  assert.ok(
    verify(
      "RSA-SHA256",
      Buffer.from(jwt.split(".").slice(0, 2).join(".")),
      createPublicKey(privateKey),
      Buffer.from(jwt.split(".")[2], "base64url"),
    ),
  );
});
const oauthEnv = {
  VERCEL_ENV: env.VERCEL_ENV,
  COLLECTION_ENABLED: env.COLLECTION_ENABLED,
  COLLECTION_ORIGIN: env.COLLECTION_ORIGIN,
  GOOGLE_SHEETS_ID: env.GOOGLE_SHEETS_ID,
  GOOGLE_AUTH_MODE: "oauth",
  GOOGLE_OAUTH_CLIENT_ID: "synthetic-client+id.apps.example",
  GOOGLE_OAUTH_CLIENT_SECRET: "synthetic-secret&=+",
  GOOGLE_OAUTH_REFRESH_TOKEN: "synthetic-refresh&=+",
};
test("OAuth refresh transport writes literal cells, requires exact readback and deduplicates across handlers", async () => {
  const google = fakeGoogle();
  const options = { env: oauthEnv, fetch: google.fetch };
  const body = payload();
  assert.deepEqual(
    (await call((await backend(options)).collection, undefined, {}, "GET"))
      .body,
    { enabled: true },
  );
  for (let i = 0; i < 2; i++) {
    const result = await call((await backend(options)).contributions, body);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      receipt: body.requestId,
      status: "recorded",
    });
  }
  assert.deepEqual(google.rows[1].slice(1), expectedFields(body));
  assert.equal(
    google.calls.filter((c) => c.url.endsWith(":batchUpdate")).length,
    1,
  );
  const conflict = await call((await backend(options)).contributions, {
    ...body,
    proposal: "different",
  });
  assert.equal(conflict.statusCode, 409);
  assert.equal(conflict.body.receipt, undefined);
  for (const token of google.calls.filter((c) => c.url.includes("oauth2"))) {
    assert.equal(token.url, "https://oauth2.googleapis.com/token");
    assert.equal(token.method, "POST");
    assert.equal(
      token.headers["Content-Type"],
      "application/x-www-form-urlencoded",
    );
    assert.equal(token.redirect, "error");
    assert.ok(token.signal instanceof AbortSignal);
    assert.deepEqual(Object.fromEntries(new URLSearchParams(token.body)), {
      grant_type: "refresh_token",
      client_id: oauthEnv.GOOGLE_OAUTH_CLIENT_ID,
      client_secret: oauthEnv.GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: oauthEnv.GOOGLE_OAUTH_REFRESH_TOKEN,
    });
  }
});
test("OAuth incomplete credentials and malformed auth modes fail closed without fallback or network", async () => {
  let network = 0;
  const invalid = [];
  for (const key of [
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "GOOGLE_OAUTH_REFRESH_TOKEN",
  ]) {
    for (const value of [undefined, "", "   ", 123, null])
      invalid.push({ ...env, ...oauthEnv, [key]: value });
  }
  for (const mode of ["", "unknown", "OAuth", " oauth", "oauth ", null, 123])
    invalid.push({ ...env, ...oauthEnv, GOOGLE_AUTH_MODE: mode });
  for (const candidate of invalid) {
    const handlers = await backend({
      env: candidate,
      fetch: async () => {
        network++;
      },
    });
    assert.deepEqual(
      (await call(handlers.collection, undefined, {}, "GET")).body,
      { enabled: false },
    );
    const result = await call(handlers.contributions, payload());
    assert.equal(result.statusCode, 503);
    assert.equal(result.body.receipt, undefined);
    assert.deepEqual(Object.keys(result.body), ["error"]);
  }
  assert.equal(network, 0);
  assert.deepEqual(
    (
      await call(
        (
          await backend({
            env: { ...env, GOOGLE_AUTH_MODE: "service_account" },
          })
        ).collection,
        undefined,
        {},
        "GET",
      )
    ).body,
    { enabled: true },
  );
});
test("OAuth token errors never reach Sheets, issue receipts or expose provider secrets", async () => {
  for (const variant of [
    "http",
    "network",
    "json",
    "missing",
    "empty",
    "blank",
    "number",
    "null",
  ]) {
    const calls = [];
    const handlers = await backend({
      env: oauthEnv,
      fetch: async (url) => {
        calls.push(url);
        if (variant === "network") throw Error("SECRET provider reason");
        return {
          ok: variant !== "http",
          json: async () => {
            if (variant === "json") throw Error("SECRET invalid JSON");
            return variant === "null"
              ? null
              : {
                  access_token: { empty: "", blank: "   ", number: 123 }[
                    variant
                  ],
                  error_description: "SECRET provider reason",
                  client_secret: oauthEnv.GOOGLE_OAUTH_CLIENT_SECRET,
                  refresh_token: oauthEnv.GOOGLE_OAUTH_REFRESH_TOKEN,
                };
          },
        };
      },
    });
    const result = await call(handlers.contributions, payload());
    assert.equal(result.statusCode, 503, variant);
    assert.equal(result.body.receipt, undefined, variant);
    assert.deepEqual(calls, ["https://oauth2.googleapis.com/token"], variant);
    assert.deepEqual(result.body, {
      error:
        "Não foi possível registrar. Preserve o mesmo identificador para tentar novamente.",
    });
  }
});
test("OAuth preserves production-only, origin and validation gates before refresh", async () => {
  let network = 0;
  const fetch = async () => {
    network++;
    throw Error("must not call");
  };
  for (const change of [
    { VERCEL_ENV: "preview" },
    { VERCEL_ENV: "development" },
    { COLLECTION_ENABLED: "false" },
    { COLLECTION_ORIGIN: "http://portal.example" },
    { GOOGLE_SHEETS_ID: "" },
    { COLLECTION_MAX_RECORDS: "0" },
  ]) {
    const handlers = await backend({ env: { ...oauthEnv, ...change }, fetch });
    assert.deepEqual(
      (await call(handlers.collection, undefined, {}, "GET")).body,
      { enabled: false },
    );
    assert.equal(
      (await call(handlers.contributions, payload())).statusCode,
      503,
    );
  }
  const { contributions } = await backend({ env: oauthEnv, fetch });
  assert.equal(
    (await call(contributions, payload(), { origin: "https://evil.example" }))
      .statusCode,
    403,
  );
  assert.equal(
    (await call(contributions, payload(), { "sec-fetch-site": "cross-site" }))
      .statusCode,
    403,
  );
  assert.equal(
    (await call(contributions, { ...payload(), proposal: " " })).statusCode,
    400,
  );
  assert.equal(network, 0);
});
test("OAuth never acknowledges missing or altered provider readback", async () => {
  for (const variant of ["missing", "altered", "blank-date"]) {
    const google = fakeGoogle();
    let reads = 0;
    const result = await call(
      (
        await backend({
          env: oauthEnv,
          fetch: async (url, options) => {
            const response = await google.fetch(url, options);
            if (url.includes("/values/") && ++reads === 2) {
              const values = google.rows.map((row) => row.slice());
              if (variant === "missing") values.pop();
              if (variant === "altered") values[1][6] = "edited";
              if (variant === "blank-date") values[1][0] = "  ";
              return { ok: true, json: async () => ({ values }) };
            }
            return response;
          },
        })
      ).contributions,
      payload(),
    );
    assert.equal(result.statusCode, variant === "altered" ? 409 : 503);
    assert.equal(result.body.receipt, undefined);
    assert.equal(
      google.calls.filter((c) => c.url.endsWith(":batchUpdate")).length,
      1,
    );
  }
});
test("lost atomic batch response reconciles read-only and retry preserves receipt/date", async () => {
  const google = fakeGoogle();
  const fetch = async (url, options) => {
    const response = await google.fetch(url, options);
    if (url.endsWith(":batchUpdate")) throw Error("connection lost");
    return response;
  };
  const first = await call((await backend({ fetch })).contributions, payload());
  assert.equal(first.statusCode, 200);
  const timestamp = google.rows[1][0];
  const retry = await call((await backend({ fetch })).contributions, payload());
  assert.deepEqual(retry.body, first.body);
  assert.equal(google.rows[1][0], timestamp);
  assert.equal(google.rows.length, 2);
  assert.equal(
    google.calls.filter((c) => c.url.endsWith(":batchUpdate")).length,
    1,
  );
});
test("network failures and unreadable confirmation never issue a receipt or leak upstream details", async () => {
  for (const stage of [
    "oauth2",
    "?fields=",
    ":batchUpdate",
    "valueRenderOption=",
  ]) {
    const google = fakeGoogle();
    const fetch = async (url, options) => {
      if (url.includes(stage)) throw Error("SECRET upstream reason");
      return google.fetch(url, options);
    };
    const result = await call(
      (await backend({ fetch })).contributions,
      payload(),
    );
    assert.equal(result.statusCode, 503);
    assert.equal(result.body.receipt, undefined);
    assert.ok(!JSON.stringify(result.body).includes("SECRET"));
    await call((await backend({ fetch })).contributions, payload());
    assert.ok(
      google.calls.filter((c) => c.url.endsWith(":batchUpdate")).length <= 1,
    );
  }
});
test("concurrent handlers contend on one unique claim instead of appending duplicate rows", async () => {
  const google = fakeGoogle();
  const a = await backend({ fetch: google.fetch });
  const b = await backend({ fetch: google.fetch });
  const outcomes = await Promise.all([
    call(a.contributions, payload()),
    call(b.contributions, payload()),
  ]);
  assert.ok(outcomes.every((o) => [200, 503].includes(o.statusCode)));
  assert.ok(outcomes.some((o) => o.statusCode === 200));
  assert.equal(google.tabs.size, 1);
  assert.equal(google.rows.length, 2);
});
test("distinct concurrent UUIDs append two literal rows to the same existing sheet", async () => {
  const google = fakeGoogle();
  const bodies = [
    payload(),
    {
      ...payload(),
      requestId: "a0000000-0000-4000-8000-000000000002",
      problem: "+literal\n@literal",
      justification: "-literal",
    },
  ];
  const outcomes = await Promise.all(
    bodies.map(async (body) =>
      call((await backend({ fetch: google.fetch })).contributions, body),
    ),
  );
  assert.ok(outcomes.every((result) => result.statusCode === 200));
  assert.equal(google.tabs.size, 1);
  assert.equal(google.rows.length, 3);
  for (const body of bodies)
    assert.deepEqual(
      google.rows.find((row) => row[8] === body.requestId).slice(1),
      expectedFields(body),
    );
  assert.ok(google.calls.every((c) => !c.body?.includes("addSheet")));
});
test("schema exports exact headers, deterministic SHA256 claim and Brasília timestamp independent of wall clock", async () => {
  const { createHash } = await import("node:crypto");
  const {
    SHEET_TITLE,
    SHEET_HEADERS,
    METADATA_KEY,
    metadataIdFor,
    brasiliaTimestamp,
  } = await import("../server/sheet-schema.mjs");
  assert.equal(SHEET_TITLE, "Contribuições");
  assert.deepEqual(SHEET_HEADERS, HEADERS);
  assert.equal(METADATA_KEY, "pme_request");
  assert.equal(
    metadataIdFor(payload().requestId),
    createHash("sha256").update(payload().requestId).digest().readUInt32BE(0) &
      0x7fffffff || 1,
  );
  assert.equal(
    brasiliaTimestamp(new Date("2026-01-02T02:04:05Z")),
    "2026-01-01 23:04:05",
  );
});
test("metadata collision or claim without row fails closed without append", async () => {
  const { metadataIdFor } = await import("../server/sheet-schema.mjs");
  for (const variant of ["collision", "orphan", "wrong-key", "wrong-id"]) {
    const google = fakeGoogle();
    const id = metadataIdFor(payload().requestId);
    const claim = {
      metadataId: variant === "wrong-id" ? id + 1 : id,
      metadataKey: variant === "wrong-key" ? "other" : "pme_request",
      metadataValue:
        variant === "collision"
          ? "a0000000-0000-4000-8000-000000000002"
          : payload().requestId,
    };
    google.metadata.set(claim.metadataId, claim);
    const result = await call(
      (await backend({ fetch: google.fetch })).contributions,
      payload(),
    );
    assert.equal(result.statusCode, 503, variant);
    assert.equal(result.body.receipt, undefined);
    assert.equal(
      google.calls.filter((c) => c.url.endsWith(":batchUpdate")).length,
      0,
    );
    assert.equal(google.rows.length, 1);
  }
});
test("invalid or edited headers, missing target and duplicate protocol rows are rejected", async () => {
  for (const variant of [
    "empty",
    "edited",
    "reordered",
    "extra",
    "missing-target",
    "duplicate",
  ]) {
    const google = fakeGoogle();
    if (variant === "empty") google.rows.length = 0;
    if (variant === "edited") google.rows[0][0] = "Data";
    if (variant === "reordered")
      [google.rows[0][0], google.rows[0][1]] = [
        google.rows[0][1],
        google.rows[0][0],
      ];
    if (variant === "extra") google.rows[0].push("Extra");
    if (variant === "missing-target") google.tabs.clear();
    if (variant === "duplicate") {
      assert.equal(
        (
          await call(
            (await backend({ fetch: google.fetch })).contributions,
            payload(),
          )
        ).statusCode,
        200,
      );
      google.rows.push(google.rows[1].slice());
      google.calls.length = 0;
    }
    const result = await call(
      (await backend({ fetch: google.fetch })).contributions,
      payload(),
    );
    assert.equal(
      result.statusCode,
      variant === "duplicate" ? 409 : 503,
      variant,
    );
    assert.equal(result.body.receipt, undefined);
    assert.equal(
      google.calls.filter((c) => c.url.endsWith(":batchUpdate")).length,
      0,
    );
  }
});
test("failed uncommitted batch is read-only reconciled; next request may safely try same deterministic claim", async () => {
  const google = fakeGoogle();
  let writes = 0;
  const fetch = async (url, options) => {
    if (url.endsWith(":batchUpdate") && ++writes === 1) return { ok: false };
    return google.fetch(url, options);
  };
  const first = await call((await backend({ fetch })).contributions, payload());
  assert.equal(first.statusCode, 503);
  assert.equal(first.body.receipt, undefined);
  assert.equal(writes, 1);
  assert.equal(google.rows.length, 1);
  assert.equal(
    (await call((await backend({ fetch })).contributions, payload()))
      .statusCode,
    200,
  );
  assert.equal(google.rows.length, 2);
});
test("unreadable post-write confirmation emits no receipt; next identical request reconciles without another append", async () => {
  const google = fakeGoogle();
  let reads = 0;
  const fetch = async (url, options) => {
    if (url.includes("/values/") && ++reads === 2) throw Error("lost readback");
    return google.fetch(url, options);
  };
  const first = await call((await backend({ fetch })).contributions, payload());
  assert.equal(first.statusCode, 503);
  assert.equal(first.body.receipt, undefined);
  assert.equal(google.rows.length, 2);
  const timestamp = google.rows[1][0];
  const again = await call((await backend({ fetch })).contributions, payload());
  assert.equal(again.statusCode, 200);
  assert.equal(google.rows[1][0], timestamp);
  assert.equal(
    google.calls.filter((c) => c.url.endsWith(":batchUpdate")).length,
    1,
  );
});
test("complete bounded read uses the default and maximum configured row window", async () => {
  for (const maximum of [undefined, "1000"]) {
    const google = fakeGoogle();
    const result = await call(
      (
        await backend({
          env: { ...env, COLLECTION_MAX_RECORDS: maximum },
          fetch: google.fetch,
        })
      ).contributions,
      payload(),
    );
    assert.equal(result.statusCode, 200);
    const ranges = google.calls
      .filter((c) => c.url.includes("/values/"))
      .map((c) => decodeURIComponent(c.url.split("/values/")[1].split("?")[0]));
    assert.deepEqual(
      ranges,
      Array(2).fill(
        `'Contribuições'!A1:I${maximum === undefined ? 501 : 1001}`,
      ),
    );
  }
});
test("strategy context is accepted literally while edited legal text and cross-objective strategies are rejected", async () => {
  const google = fakeGoogle();
  const handlers = await backend({ fetch: google.fetch });
  const body = {
    ...payload(),
    context: contextFor(
      catalog,
      "3 A",
      4,
      "Estratégia",
      catalog.objectives.find((o) => o.id === 4).strategies[0].id,
    ),
  };
  assert.equal((await call(handlers.contributions, body)).statusCode, 200);
  assert.equal(
    (
      await call(handlers.contributions, {
        ...body,
        context: {
          ...body.context,
          strategy: body.context.strategy + " edited",
        },
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (
      await call(handlers.contributions, {
        ...body,
        context: {
          ...body.context,
          strategy: contextFor(catalog, "1", 1, "Estratégia", "1.1.").strategy,
        },
      })
    ).statusCode,
    400,
  );
});
test("Vercel pre-parsed bodies enforce size and configuration stays closed in previews", async () => {
  const google = fakeGoogle();
  const { contributions } = await backend({ fetch: google.fetch });
  const res = {
    setHeader() {},
    end(text) {
      this.body = JSON.parse(text);
    },
  };
  await contributions(
    {
      method: "POST",
      headers: {
        origin: env.COLLECTION_ORIGIN,
        "content-type": "application/json",
      },
      body: payload(),
    },
    res,
  );
  assert.equal(res.statusCode, 200);
  await contributions(
    {
      method: "POST",
      headers: {
        origin: env.COLLECTION_ORIGIN,
        "content-type": "application/json",
      },
      body: { ...payload(), problem: "x".repeat(33000) },
    },
    res,
  );
  assert.equal(res.statusCode, 413);
  assert.equal(
    (await call(contributions, payload(), { "content-length": "32769" }))
      .statusCode,
    413,
  );
  for (const change of [
    { VERCEL_ENV: "preview" },
    { VERCEL_ENV: "development" },
    { COLLECTION_ENABLED: "TRUE" },
    { COLLECTION_ORIGIN: "http://portal.example" },
    { COLLECTION_ORIGIN: "https://portal.example/path" },
    { GOOGLE_PRIVATE_KEY: "bad-key" },
    { COLLECTION_MAX_RECORDS: "0" },
  ]) {
    const handlers = await backend({
      env: { ...env, ...change },
      fetch: () => {
        throw Error("must not call");
      },
    });
    assert.deepEqual(
      (await call(handlers.collection, undefined, {}, "GET")).body,
      { enabled: false },
    );
  }
});

test("bounded durable ledger refuses new UUIDs at configured capacity but accepts existing receipts", async () => {
  const google = fakeGoogle();
  const options = {
    fetch: google.fetch,
    env: { ...env, COLLECTION_MAX_RECORDS: "1" },
  };
  const handlers = await backend(options);
  assert.equal((await call(handlers.contributions, payload())).statusCode, 200);
  assert.equal(
    (
      await call(handlers.contributions, {
        ...payload(),
        requestId: "a0000000-0000-4000-8000-000000000002",
      })
    ).statusCode,
    503,
  );
  assert.equal(
    (await call((await backend(options)).contributions, payload())).statusCode,
    200,
  );
});
test("Vercel function entry points default to closed without configuration", async () => {
  for (const [path, method] of [
    ["../api/collection.js", "GET"],
    ["../api/contributions.js", "POST"],
  ]) {
    const { default: handler } = await import(path);
    const result = await call(handler, undefined, {}, method);
    assert.deepEqual(
      result.body,
      method === "GET"
        ? { enabled: false }
        : {
            error:
              "Não foi possível registrar. Preserve o mesmo identificador para tentar novamente.",
          },
    );
  }
});
test("request boundary rejects origin, methods, sizes, honeypot and noncanonical content before network", async () => {
  let network = 0;
  const { contributions } = await backend({
    fetch: async () => {
      network++;
      throw Error("forbidden");
    },
  });
  for (const origin of [
    "",
    "https://evil.example",
    "null",
    env.COLLECTION_ORIGIN + "/",
  ])
    assert.equal(
      (await call(contributions, payload(), { origin })).statusCode,
      403,
    );
  assert.equal(
    (await call(contributions, payload(), { "sec-fetch-site": "cross-site" }))
      .statusCode,
    403,
  );
  assert.equal(
    (await call(contributions, payload(), {}, "GET")).statusCode,
    405,
  );
  assert.equal(
    (await call(contributions, payload(), { "content-type": "text/plain" }))
      .statusCode,
    415,
  );
  assert.equal((await call(contributions, "x".repeat(32769))).statusCode, 413);
  assert.equal((await call(contributions, "{")).statusCode, 400);
  const invalid = [
    { proposal: "" },
    { proposal: "   " },
    { proposal: "a".repeat(8001) },
    { problem: "a".repeat(4001) },
    { justification: "a".repeat(4001) },
    { website: "bot" },
    { requestId: "not-a-uuid" },
    { extra: true },
    { context: { ...payload().context, group: "1" } },
    { context: { ...payload().context, strategy: "unused" } },
    { context: { ...payload().context, objective: "Objetivo 19" } },
    { proposal: null },
  ];
  for (const change of invalid)
    assert.equal(
      (await call(contributions, { ...payload(), ...change })).statusCode,
      400,
    );
  assert.equal(network, 0);
});
