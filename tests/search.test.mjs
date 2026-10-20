import test from "node:test";
import assert from "node:assert/strict";
import { filterStrategies } from "../src/domain.js";
const rows = [
  { id: "4.1", label: "Estratégia 4.1", text: "Educação PÚBLICA integral" },
  { id: "4.2", label: "Estratégia 4.2", text: "Formação docente" },
];
test("busca por texto ou ID oficial ignora acentos/case e não altera a lista", () => {
  assert.deepEqual(filterStrategies(rows, "educacao publica"), [rows[0]]);
  assert.deepEqual(filterStrategies(rows, "ESTRATEGIA 4.2"), [rows[1]]);
  assert.deepEqual(filterStrategies(rows, "4.1"), [rows[0]]);
  assert.deepEqual(filterStrategies(rows, "inexistente"), []);
  assert.deepEqual(filterStrategies(rows, "  "), rows);
  assert.equal(rows.length, 2);
});
