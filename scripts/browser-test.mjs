// Executar com Playwright instalado e navegador disponível. Nenhum recurso Google é acessado.
import assert from "node:assert/strict";
import { build } from "rolldown";
import { readFile, writeFile } from "node:fs/promises";
import React from "react";
import { renderToString } from "react-dom/server";
import { App } from "../node_modules/.cache/pme-ssr.mjs";
const catalog = JSON.parse(await readFile("data/pne-catalog.json", "utf8"));
async function checkSearch(page) {
  const rows = catalog.objectives.find((o) => o.id === 4).strategies;
  const search = page.getByRole("combobox", {
    name: "Estratégia",
    exact: true,
  });
  const list = page.getByRole("listbox");
  const iframe = (await page.locator("iframe").count())
    ? await page.locator("iframe").elementHandle()
    : null;
  const src = iframe && (await iframe.getAttribute("src"));
  async function stable() {
    if (iframe) {
      assert.equal(await iframe.evaluate((el) => el.isConnected), true);
      assert.equal(await page.locator("iframe").getAttribute("src"), src);
    }
  }
  assert.equal(await search.inputValue(), "");
  await search.evaluate((el) => el.scrollIntoView({ block: "end" }));
  await search.click();
  const popupBox = await list.boundingBox();
  assert.ok(
    popupBox.y + Math.min(popupBox.height, 160) <= page.viewportSize().height,
    "A lista aberta deve mostrar resultados sem exigir uma rolagem adicional",
  );
  await search.fill("4.");
  await search.press("Enter");
  assert.equal(await page.locator(".reading [data-legal]").count(), 0);
  await search.fill("zzzzlivre");
  assert.equal(await page.locator(".reading [data-legal]").count(), 0);
  assert.equal(
    await page
      .getByRole("button", { name: "Preparar contribuição", exact: true })
      .count(),
    0,
  );
  await search.press("Escape");
  assert.equal(await search.inputValue(), "");
  await search.focus();
  await search.press("ArrowDown");
  assert.equal(await search.getAttribute("aria-expanded"), "true");
  assert.equal(
    await search.getAttribute("aria-controls"),
    await list.getAttribute("id"),
  );
  const active = await search.getAttribute("aria-activedescendant");
  assert.ok(active);
  assert.equal(
    await page.locator(`[id="${active}"]`).getAttribute("aria-selected"),
    "false",
  );
  assert.match(
    await page.locator(".reading").innerText(),
    /Selecione uma estratégia/,
  );
  await stable();
  await search.press("Enter");
  const text = await page.locator(".reading").innerText();
  assert.ok(text.includes(rows[0].text));
  assert.equal(
    await search.evaluate((el) => el === document.activeElement),
    true,
  );
  await stable();
  for (const query of [rows[0].id, "EDUCAÇÃO", "educacao"]) {
    await search.fill(query);
    const normalize = (v) =>
      v.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    const matches = rows.filter((r) =>
      normalize(`${r.id} ${r.label} ${r.text}`).includes(normalize(query)),
    );
    assert.equal(await list.getByRole("option").count(), matches.length);
    for (let i = 0; i < matches.length; i++) {
      assert.equal(
        await list.getByRole("option").nth(i).innerText(),
        `${matches[i].label} — ${matches[i].text}`,
      );
    }
    assert.match(
      await page.getByRole("status").innerText(),
      new RegExp(`^${matches.length} estratégia`),
    );
    assert.equal(await page.locator(".reading").innerText(), text);
    await stable();
  }
  await search.fill("zzzzsemresultado");
  assert.equal(await list.getByRole("option").count(), 0);
  assert.equal(await search.getAttribute("aria-activedescendant"), null);
  assert.match(await list.innerText(), /Nenhum resultado/);
  assert.match(
    await page.getByRole("status").innerText(),
    /seleção.*preservada/i,
  );
  await search.press("Enter");
  assert.equal(await page.locator(".reading").innerText(), text);
  await search.press("Escape");
  assert.equal(await search.inputValue(), `${rows[0].label} — ${rows[0].text}`);
  await search.fill("zzzz");
  await search.press("Tab");
  assert.equal(await search.getAttribute("aria-expanded"), "false");
  assert.equal(await search.inputValue(), `${rows[0].label} — ${rows[0].text}`);
  assert.equal(
    await search.evaluate((el) => el === document.activeElement),
    false,
  );
  await search.fill("zzzz");
  await page.locator("h1").click();
  assert.equal(await search.getAttribute("aria-expanded"), "false");
  assert.equal(await search.inputValue(), `${rows[0].label} — ${rows[0].text}`);
  await page
    .getByRole("button", { name: "Abrir lista de estratégias" })
    .click();
  assert.equal(await list.getByRole("option").count(), rows.length);
  assert.equal(
    await list.getByRole("option").first().getAttribute("aria-selected"),
    "true",
  );
  await search.press("ArrowDown");
  await search.press("ArrowUp");
  const highlighted = await search.getAttribute("aria-activedescendant");
  assert.equal(
    await page.locator(`[id="${highlighted}"]`).getAttribute("aria-selected"),
    "false",
  );
  assert.equal(await page.locator(".reading").innerText(), text);
  await search.fill("educacao");
  await page.getByRole("button", { name: "Limpar pesquisa" }).click();
  assert.equal(await search.inputValue(), "");
  assert.equal(await page.locator(".reading").innerText(), text);
  const option = list.getByRole("option").nth(1);
  if (page.viewportSize().width < 480) await option.tap();
  else await option.click();
  assert.ok(
    (await page.locator(".reading").innerText()).includes(rows[1].text),
  );
  assert.equal(
    await search.evaluate((el) => el === document.activeElement),
    true,
  );
  await stable();
  if (iframe) {
    await page
      .getByRole("button", {
        name: "Alterar o assunto da contribuição",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Cancelar e preservar formulário" })
      .click();
    await stable();
  }
}
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  throw new Error(
    "Playwright indisponível. Instale-o em ambiente autorizado; validação de navegador não executada.",
  );
}
const fixture = {
  enabled: true,
  approved: true,
  prefillVerified: true,
  responderUri:
    "https://docs.google.com/forms/d/e/FICTITIOUS_TEST_ONLY/viewform",
  verifiedNativePrefillUri:
    "https://docs.google.com/forms/d/e/FICTITIOUS_TEST_ONLY/viewform?entry.1=test&entry.2=test&entry.3=Geral&entry.4=test",
  entries: {
    group: "entry.1",
    objective: "entry.2",
    mode: "entry.3",
    strategy: "entry.4",
  },
};
await writeFile(
  "node_modules/.cache/browser-fixture.jsx",
  `import React from 'react';import {hydrateRoot} from 'react-dom/client';import {App} from '../../src/App.jsx';hydrateRoot(document.getElementById('root'),<App config={${JSON.stringify(fixture)}}/>);`,
);
await build({
  input: "node_modules/.cache/browser-fixture.jsx",
  output: { file: "node_modules/.cache/browser-fixture.js", format: "esm" },
  transform: {
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
  },
});
const browser = await chromium.launch();
try {
  for (const width of [1280, 375, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      hasTouch: width < 480,
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.route("**/*", async (route) => {
      const u = new URL(route.request().url());
      if (u.origin === "http://127.0.0.1:4173") return route.continue();
      throw new Error("Rede externa inesperada no demo: " + u.origin);
    });
    await page.goto("http://127.0.0.1:4173");
    await page.locator("#group:enabled").waitFor();
    const logo = page.getByRole("img", {
      name: "Fraiburgo — Secretaria de Educação",
      exact: true,
    });
    await logo.evaluate((img) => img.decode());
    const brand = await logo.evaluate((img) => {
      const box = img.getBoundingClientRect();
      const style = getComputedStyle(img);
      return {
        width: box.width,
        height: box.height,
        left: box.left,
        right: box.right,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        position: style.position,
        overflow: getComputedStyle(img.parentElement).overflow,
      };
    });
    assert.equal(brand.naturalWidth, 7342);
    assert.equal(brand.naturalHeight, 1000);
    assert.ok(Math.abs(brand.width / brand.height - 7.342) < 0.01);
    assert.ok(brand.left >= 0 && brand.right <= width);
    assert.ok(brand.width >= (width === 1280 ? 600 : width - 40));
    assert.equal(brand.position, "static");
    assert.equal(brand.overflow, "visible");
    assert.equal(await page.locator("header").innerText(), "");
    assert.equal(
      await page.locator("footer").innerText(),
      "Município de Fraiburgo · Secretaria Municipal de Educação\n" +
        "Consulta demonstrativa. Nenhuma contribuição é coletada nesta versão.",
    );
    assert.equal(
      await page
        .locator(".notice")
        .evaluate((el) => getComputedStyle(el).borderLeftColor),
      "rgb(168, 81, 138)",
    );

    assert.match(
      await page.locator(".notice").innerText(),
      /Coleta ainda não aberta/,
    );
    if (width < 480)
      assert.ok((await page.locator("#group").boundingBox()).y < 400);
    assert.equal(await page.locator("#objective").count(), 0);
    await page.locator("#group").selectOption("3 A");
    assert.equal(await page.locator("#objective").inputValue(), "");
    await page.locator("#objective").selectOption("4");
    assert.equal(
      await page
        .getByRole("button", { name: "Preparar contribuição" })
        .isDisabled(),
      true,
    );
    await page.getByRole("radio", { name: "Estratégia", exact: true }).check();
    assert.equal(
      await page.getByRole("button", { name: "Preparar contribuição" }).count(),
      0,
    );
    assert.match(
      await page.locator("fieldset").innerText(),
      /Sugestões sobre o conjunto de estratégias do objetivo/,
    );
    assert.match(
      await page.locator("fieldset").innerText(),
      /Sugestão sobre uma estratégia específica/,
    );
    assert.equal(
      await page
        .getByRole("radio", { name: "Estratégia", exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await checkSearch(page);
    await page
      .getByRole("combobox", { name: "Estratégia", exact: true })
      .fill("teste");
    await page.locator("#objective").selectOption("17");
    assert.equal(
      await page
        .getByRole("combobox", { name: "Estratégia", exact: true })
        .count(),
      0,
    );
    await page.getByRole("radio", { name: "Estratégia", exact: true }).check();
    assert.equal(
      await page
        .getByRole("combobox", { name: "Estratégia", exact: true })
        .inputValue(),
      "",
    );
    await page
      .getByRole("combobox", { name: "Estratégia", exact: true })
      .fill("teste");
    await page.locator("#group").selectOption("3 B");
    assert.equal(
      await page
        .getByRole("combobox", { name: "Estratégia", exact: true })
        .count(),
      0,
    );
    await page.locator("#objective").selectOption("4");
    await page.getByRole("radio", { name: "Estratégia", exact: true }).check();
    assert.equal(
      await page
        .getByRole("combobox", { name: "Estratégia", exact: true })
        .inputValue(),
      "",
    );
    assert.equal(await page.locator("iframe").count(), 0);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.keyboard.press("Tab");
    assert.ok(
      await page.evaluate(() => document.activeElement !== document.body),
    );
    assert.deepEqual(errors, []);
    await page.close();
  }
  for (const mode of ["no-js", "module-failure"]) {
    const context = await browser.newContext({
      javaScriptEnabled: mode !== "no-js",
    });
    const page = await context.newPage();
    if (mode === "module-failure")
      await page.route("**/app.js", (r) => r.abort());
    await page.goto("http://127.0.0.1:4173");
    await page.locator("summary").click();
    assert.equal(await page.locator("[data-legal]").count(), 464);
    assert.equal(await page.locator("#group").isDisabled(), true);
    await context.close();
  }
  const page = await browser.newPage();
  let loads = 0;
  const fixtureErrors = [];
  page.on("pageerror", (e) => fixtureErrors.push(String(e)));
  const demoHtml = await readFile("dist/index.html", "utf8");
  const fixtureHtml = demoHtml.replace(
    /<div id="root">[\s\S]*<\/div><script/,
    () =>
      '<div id="root">' +
      renderToString(React.createElement(App, { config: fixture })) +
      "</div><script",
  );
  await page.route("**/*", async (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === "docs.google.com") {
      assert.ok(u.pathname.includes("FICTITIOUS_TEST_ONLY"));
      loads++;
      return route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Fixture fictícia</title><p>Sem envio real</p>",
      });
    }
    if (u.origin !== "http://127.0.0.1:4173") throw new Error("Rede bloqueada");
    if (u.pathname === "/")
      return route.fulfill({ contentType: "text/html", body: fixtureHtml });
    if (u.pathname === "/app.js")
      return route.fulfill({
        contentType: "text/javascript",
        body: await readFile("node_modules/.cache/browser-fixture.js", "utf8"),
      });
    return route.continue();
  });
  await page.goto("http://127.0.0.1:4173");
  await page.locator("#group:enabled").waitFor();
  await page.locator("#group").selectOption("3 A");
  await page.locator("#objective").selectOption("4");
  await page
    .getByRole("button", { name: "Preparar contribuição", exact: true })
    .click();
  await page.locator("iframe").waitFor();
  await page.waitForFunction(
    () => document.querySelector("iframe")?.contentWindow !== null,
  );
  const original = await page.locator("iframe").elementHandle();
  const src = await original.getAttribute("src");
  await page.getByRole("radio", { name: "Estratégia", exact: true }).check();
  await checkSearch(page);
  assert.equal(await original.evaluate((el) => el.isConnected), true);
  assert.equal(await page.locator("iframe").getAttribute("src"), src);
  await page.locator("#group").selectOption("3 B");
  assert.equal(await original.evaluate((el) => el.isConnected), true);
  await page.locator("#objective").selectOption("4");
  assert.equal(await page.locator("iframe").getAttribute("src"), src);
  await page
    .getByRole("button", { name: "Alterar o assunto da contribuição" })
    .click();
  await page
    .getByRole("button", { name: "Cancelar e preservar formulário" })
    .click();
  assert.equal(await original.evaluate((el) => el.isConnected), true);
  assert.equal(await page.locator("iframe").getAttribute("src"), src);
  await page
    .getByRole("button", { name: "Alterar o assunto da contribuição" })
    .click();
  await page.keyboard.press("Escape");
  assert.equal(await original.evaluate((el) => el.isConnected), true);
  assert.equal(
    await page
      .getByRole("button", {
        name: "Alterar o assunto da contribuição",
        exact: true,
      })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page
    .getByRole("button", {
      name: "Alterar o assunto da contribuição",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirmar alteração do assunto" })
    .click();
  assert.equal(await original.evaluate((el) => el.isConnected), false);
  assert.notEqual(await page.locator("iframe").getAttribute("src"), src);
  assert.deepEqual(fixtureErrors, []);
  assert.ok(loads >= 1);
  console.log(
    "Fluxo, mobile, fallback e fixture interceptada passaram. Nenhuma resposta enviada.",
  );
} finally {
  await browser.close();
}
