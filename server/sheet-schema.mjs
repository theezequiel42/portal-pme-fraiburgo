import { createHash } from "node:crypto";

export const SHEET_TITLE = "Contribuições";
export const SHEET_HEADERS = Object.freeze([
  "Recebido em (Brasília)",
  "Grupo de trabalho",
  "Objetivo",
  "Modalidade",
  "Estratégia",
  "Problema",
  "Proposta",
  "Justificativa",
  "Protocolo",
]);
export const METADATA_KEY = "pme_request";
export function metadataIdFor(requestId) {
  return (
    createHash("sha256").update(requestId).digest().readUInt32BE(0) &
      0x7fffffff || 1
  );
}
export function brasiliaTimestamp(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}
