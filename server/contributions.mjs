import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { groups, contextFor } from "../src/domain.js";
import {
  SHEET_TITLE,
  SHEET_HEADERS,
  METADATA_KEY,
  metadataIdFor,
  brasiliaTimestamp,
} from "./sheet-schema.mjs";
const catalog = JSON.parse(
  readFileSync(new URL("../data/pne-catalog.json", import.meta.url)),
);
const contexts = new Set(
  groups.flatMap((g) =>
    g.objectives.flatMap((id) => {
      const objective = catalog.objectives.find((o) => o.id === id);
      return [
        contextFor(catalog, g.id, id, "Geral", ""),
        ...objective.strategies.map((s) =>
          contextFor(catalog, g.id, id, "Estratégia", s.id),
        ),
      ].map((c) => JSON.stringify(Object.values(c)));
    }),
  ),
);
class RequestError extends Error {
  constructor(status) {
    super("Request rejected");
    this.status = status;
  }
}
function validate(body) {
  const keys = [
    "requestId",
    "context",
    "problem",
    "proposal",
    "justification",
    "website",
  ];
  if (
    !body ||
    typeof body !== "object" ||
    Object.keys(body).length !== keys.length ||
    !keys.every((k) => Object.hasOwn(body, k))
  )
    throw new RequestError(400);
  if (
    typeof body.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      body.requestId,
    )
  )
    throw new RequestError(400);
  const c = body.context;
  if (
    !c ||
    Object.keys(c).length !== 4 ||
    !["group", "objective", "mode", "strategy"].every(
      (k) => typeof c[k] === "string",
    ) ||
    !contexts.has(JSON.stringify([c.group, c.objective, c.mode, c.strategy]))
  )
    throw new RequestError(400);
  for (const [key, limit] of [
    ["problem", 4000],
    ["proposal", 8000],
    ["justification", 4000],
  ])
    if (
      typeof body[key] !== "string" ||
      body[key].length > limit ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body[key])
    )
      throw new RequestError(400);
  if (!body.proposal.trim() || body.website !== "") throw new RequestError(400);
  return body;
}
async function parseBody(req) {
  const declared = req.headers["content-length"];
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > 32768))
    throw new RequestError(413);
  // Vercel may already have parsed JSON; enforce the same byte limit there.
  if (req.body !== undefined) {
    const raw = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > 32768) throw new RequestError(413);
    try {
      return validate(JSON.parse(raw));
    } catch (e) {
      throw e instanceof RequestError ? e : new RequestError(400);
    }
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += Buffer.byteLength(chunk);
    if (size > 32768) throw new RequestError(413);
    chunks.push(Buffer.from(chunk));
  }
  try {
    return validate(JSON.parse(Buffer.concat(chunks).toString("utf8")));
  } catch (e) {
    throw e instanceof RequestError ? e : new RequestError(400);
  }
}

function configuration(env) {
  try {
    if (env.COLLECTION_ENABLED !== "true" || env.VERCEL_ENV !== "production")
      return null;
    const origin = new URL(env.COLLECTION_ORIGIN);
    if (origin.protocol !== "https:" || origin.origin !== env.COLLECTION_ORIGIN)
      return null;
    if (!/^[\w-]+$/.test(env.GOOGLE_SHEETS_ID || "")) return null;
    const authMode =
      env.GOOGLE_AUTH_MODE === undefined
        ? "service_account"
        : env.GOOGLE_AUTH_MODE;
    if (authMode !== "oauth" && authMode !== "service_account") return null;
    let auth;
    if (authMode === "oauth") {
      if (
        ![
          env.GOOGLE_OAUTH_CLIENT_ID,
          env.GOOGLE_OAUTH_CLIENT_SECRET,
          env.GOOGLE_OAUTH_REFRESH_TOKEN,
        ].every((value) => typeof value === "string" && value.trim().length > 0)
      )
        return null;
      auth = {
        mode: "oauth",
        clientId: env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        refreshToken: env.GOOGLE_OAUTH_REFRESH_TOKEN,
      };
    } else {
      if (
        !/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(
          env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
        )
      )
        return null;
      const key = createPrivateKey(
        (env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      );
      if (
        key.asymmetricKeyType !== "rsa" ||
        key.asymmetricKeyDetails.modulusLength < 2048
      )
        return null;
      auth = {
        mode: "service_account",
        key,
        email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      };
    }
    const maximum = env.COLLECTION_MAX_RECORDS ?? "500";
    if (!/^[1-9]\d{0,3}$/.test(maximum) || Number(maximum) > 1000) return null;
    return {
      origin: origin.origin,
      auth,
      spreadsheet: env.GOOGLE_SHEETS_ID,
      maximum: Number(maximum),
    };
  } catch {
    return null;
  }
}
function reply(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(body));
}
async function record(config, body, fetch) {
  let tokenForm;
  if (config.auth.mode === "oauth") {
    tokenForm = {
      grant_type: "refresh_token",
      client_id: config.auth.clientId,
      client_secret: config.auth.clientSecret,
      refresh_token: config.auth.refreshToken,
    };
  } else {
    const encode = (value) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: config.auth.email, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 300 })}`;
    const assertion = `${unsigned}.${sign("RSA-SHA256", Buffer.from(unsigned), config.auth.key).toString("base64url")}`;
    tokenForm = {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    };
  }
  const request = async (url, options) => {
    const response = await fetch(url, {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new RequestError(503);
    return response.json();
  };
  const token = await request("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(tokenForm).toString(),
  });
  if (typeof token?.access_token !== "string" || !token.access_token.trim())
    throw new RequestError(503);
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheet}`;
  const sheets = (path, method = "GET", data) =>
    request(base + path, {
      method,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  const metadataId = metadataIdFor(body.requestId);
  const expected = [
    body.context.group,
    body.context.objective,
    body.context.mode,
    body.context.strategy,
    body.problem,
    body.proposal,
    body.justification,
    body.requestId,
  ];
  const inspect = async () => {
    const metadata = await sheets(
      "?fields=sheets(properties(sheetId,title)),developerMetadata(metadataId,metadataKey,metadataValue)",
    );
    if (
      !Array.isArray(metadata.sheets) ||
      (metadata.developerMetadata !== undefined &&
        !Array.isArray(metadata.developerMetadata))
    )
      throw new RequestError(503);
    const targets = metadata.sheets.filter(
      (s) => s.properties?.title === SHEET_TITLE,
    );
    if (
      targets.length !== 1 ||
      !Number.isInteger(targets[0].properties.sheetId) ||
      targets[0].properties.sheetId < 0
    )
      throw new RequestError(503);
    const claims = metadata.developerMetadata || [];
    const atId = claims.filter((m) => m.metadataId === metadataId);
    const forUuid = claims.filter(
      (m) =>
        m.metadataKey === METADATA_KEY && m.metadataValue === body.requestId,
    );
    if (
      atId.length > 1 ||
      atId.some(
        (m) =>
          m.metadataKey !== METADATA_KEY || m.metadataValue !== body.requestId,
      ) ||
      forUuid.length > 1 ||
      forUuid.some((m) => m.metadataId !== metadataId)
    )
      throw new RequestError(503);
    const result = await sheets(
      `/values/${encodeURIComponent(`'${SHEET_TITLE}'!A1:I${config.maximum + 1}`)}?valueRenderOption=UNFORMATTED_VALUE`,
    );
    const rows = result.values;
    if (
      !Array.isArray(rows) ||
      !Array.isArray(rows[0]) ||
      rows[0].length !== SHEET_HEADERS.length ||
      !SHEET_HEADERS.every((header, i) => rows[0][i] === header) ||
      rows.length > config.maximum + 1
    )
      throw new RequestError(503);
    const seen = new Set();
    for (const row of rows.slice(1)) {
      if (
        !Array.isArray(row) ||
        row.length !== 9 ||
        row.some((value) => typeof value !== "string") ||
        !row[0].trim() ||
        !row[8].trim()
      )
        throw new RequestError(503);
      if (seen.has(row[8])) throw new RequestError(409);
      seen.add(row[8]);
    }
    const matching = rows.slice(1).find((row) => row[8] === body.requestId);
    if (matching && !expected.every((value, i) => matching[i + 1] === value))
      throw new RequestError(409);
    if (atId.length && !matching) throw new RequestError(503);
    if (matching && !atId.length) throw new RequestError(503);
    return {
      recorded: !!matching,
      count: rows.length - 1,
      sheetId: targets[0].properties.sheetId,
    };
  };
  const before = await inspect();
  if (before.recorded) return;
  if (before.count >= config.maximum) throw new RequestError(503);
  // All requests commit together, or none commits. The deterministic,
  // spreadsheet-unique metadata ID is the durable claim; collisions fail closed.
  try {
    await sheets(":batchUpdate", "POST", {
      requests: [
        {
          createDeveloperMetadata: {
            developerMetadata: {
              metadataId,
              metadataKey: METADATA_KEY,
              metadataValue: body.requestId,
              location: { spreadsheet: true },
              visibility: "DOCUMENT",
            },
          },
        },
        {
          appendCells: {
            sheetId: before.sheetId,
            rows: [
              {
                values: [brasiliaTimestamp(), ...expected].map(
                  (stringValue) => ({ userEnteredValue: { stringValue } }),
                ),
              },
            ],
            fields: "userEnteredValue",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: before.sheetId,
              dimension: "ROWS",
              startIndex: 1,
            },
          },
        },
      ],
    });
  } catch {
    // An HTTP/transport failure can conceal a committed atomic batch. Read only;
    // never repeat a write here, even when reconciliation itself fails.
    if (!(await inspect()).recorded) throw new RequestError(503);
    return;
  }
  if (!(await inspect()).recorded) throw new RequestError(503);
}
export function createHandlers({
  env = process.env,
  fetch = globalThis.fetch,
} = {}) {
  const config = configuration(env);
  return {
    async collection(req, res) {
      reply(
        res,
        req.method === "GET" ? 200 : 405,
        req.method === "GET"
          ? { enabled: !!config }
          : { error: "Método não permitido." },
      );
    },
    async contributions(req, res) {
      try {
        if (!config) throw new RequestError(503);
        if (req.method !== "POST") throw new RequestError(405);
        if (
          req.headers.origin !== config.origin ||
          (req.headers["sec-fetch-site"] &&
            req.headers["sec-fetch-site"] !== "same-origin")
        )
          throw new RequestError(403);
        if (
          !/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
            req.headers["content-type"] || "",
          )
        )
          throw new RequestError(415);
        const body = await parseBody(req);
        await record(config, body, fetch);
        reply(res, 200, { receipt: body.requestId, status: "recorded" });
      } catch (error) {
        reply(res, error instanceof RequestError ? error.status : 503, {
          error:
            "Não foi possível registrar. Preserve o mesmo identificador para tentar novamente.",
        });
      }
    },
  };
}
