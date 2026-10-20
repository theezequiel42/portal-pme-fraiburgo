export const groups = [
  ["1", "Educação Infantil", [1, 2, 17]],
  ["2", "Alfabetização", [3, 17]],
  ["3 A", "Fundamental — Anos Iniciais", [4, 17]],
  ["3 B", "Fundamental — Anos Finais", [4, 17]],
  ["4", "Ensino Médio", [5, 17]],
  ["5", "Educação Integral", [6, 17]],
  ["6", "Educação Digital", [7, 17]],
  ["7", "Sustentabilidade", [8]],
  ["8", "Educação Indígena, do Campo e Quilombola", [9, 17]],
  ["9", "Educação Especial e Inclusiva", [10, 17]],
  ["10", "Educação de Jovens e Adultos", [11, 17]],
  ["11", "Educação Profissional e Tecnológica", [12, 13, 17]],
  ["12", "Ensino Superior", [14, 15, 16]],
  ["13", "Gestão Democrática", [18]],
  ["14", "Financiamento da Educação", [19]],
].map(([id, name, objectives]) => ({ id, name, objectives }));
export function contextFor(catalog, groupId, objectiveId, mode, strategyId) {
  const group = groups.find((g) => g.id === groupId);
  const objective = catalog.objectives.find(
    (o) => o.id === Number(objectiveId),
  );
  if (
    !group ||
    !objective ||
    !group.objectives.includes(objective.id) ||
    !["Geral", "Estratégia"].includes(mode)
  )
    return null;
  const strategy =
    mode === "Estratégia"
      ? objective.strategies.find((s) => s.id === strategyId)
      : null;
  if (mode === "Estratégia" && !strategy) return null;
  return {
    group: `${group.id} — ${group.name}`,
    objective: objective.label,
    mode,
    strategy: strategy ? `${strategy.label}: ${strategy.text}` : "",
  };
}
export const sameContext = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Busca somente a lista do objetivo; não altera a seleção nem o assunto do Forms.
export function filterStrategies(strategies, query) {
  const normalize = (value) =>
    value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
  const term = normalize(query.trim());
  return strategies.filter((s) =>
    normalize(`${s.id} ${s.label} ${s.text}`).includes(term),
  );
}
