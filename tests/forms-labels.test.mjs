import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contextFor, groups } from "../src/domain.js";
const catalog = JSON.parse(
  readFileSync(new URL("../data/pne-catalog.json", import.meta.url)),
);

test("context values match exact choice labels in the created native Google Form", () => {
  for (const group of groups) {
    for (const id of group.objectives) {
      const context = contextFor(catalog, group.id, id, "Geral", "");
      assert.equal(context.group, `${group.id} — ${group.name}`);
      assert.equal(context.objective, `Objetivo ${id}`);
      assert.equal(context.mode, "Geral");
      assert.equal(context.strategy, "");
    }
  }
});
