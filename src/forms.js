export const demoConfig = Object.freeze({ enabled: false });
export function validateConfig(config) {
  if (!config?.enabled) return false;
  if (config.approved !== true || config.prefillVerified !== true) return false;
  try {
    const url = new URL(config.responderUri);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "docs.google.com" ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !/^\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/.test(url.pathname)
    )
      return false;
    const ids = ["group", "objective", "mode", "strategy"].map(
      (k) => config.entries?.[k],
    );
    if (
      !ids.every((v) => typeof v === "string" && /^entry\.[0-9]+$/.test(v)) ||
      new Set(ids).size !== 4
    )
      return false;
    const evidence = new URL(config.verifiedNativePrefillUri);
    return (
      evidence.origin === url.origin &&
      evidence.pathname === url.pathname &&
      !evidence.username &&
      !evidence.password &&
      !evidence.hash &&
      ids.every((id) => evidence.searchParams.has(id))
    );
  } catch {
    return false;
  }
}
export function formUrl(config, context) {
  if (!validateConfig(config) || !context)
    throw new Error("Configuração de coleta indisponível");
  const url = new URL(config.responderUri);
  url.searchParams.set("embedded", "true");
  for (const key of ["group", "objective", "mode", "strategy"])
    url.searchParams.set(config.entries[key], context[key]);
  return url.href;
}
