import React, { useEffect, useRef, useState } from "react";

export function ContributionForm({ context }) {
  const [fields, setFields] = useState({
    problem: "",
    proposal: "",
    justification: "",
    website: "",
  });
  const [state, setState] = useState("editing");
  const [receipt, setReceipt] = useState("");
  const attempt = useRef(null);
  const locked = useRef(false);
  const message = useRef(null);
  useEffect(() => {
    if (["error", "recorded"].includes(state)) message.current?.focus();
  }, [state]);
  useEffect(() => {
    function warn(event) {
      if (state !== "recorded" && Object.values(fields).some(Boolean)) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [fields, state]);
  async function submit(event) {
    event.preventDefault();
    if (locked.current || state === "recorded") return;
    locked.current = true;
    setState("sending");
    try {
      // Um envio incerto conserva UUID e conteúdo: repetir nunca cria outro pedido.
      attempt.current ??= {
        requestId: crypto.randomUUID(),
        context,
        ...fields,
      };
      const response = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(attempt.current),
        signal: AbortSignal.timeout(25000),
      });
      const result = await response.json();
      if (
        !response.ok ||
        result.status !== "recorded" ||
        result.receipt !== attempt.current.requestId
      )
        throw new Error("Gravação não confirmada");
      setReceipt(result.receipt);
      setState("recorded");
    } catch {
      setState("error");
    } finally {
      locked.current = false;
    }
  }
  return (
    <form
      onSubmit={submit}
      aria-label="Contribuição"
      aria-busy={state === "sending"}
    >
      <p className="form-guidance">
        O rascunho fica somente nesta página, sem salvamento automático.
        Não inclua dados pessoais sensíveis.
      </p>
      <details className="privacy">
        <summary>Como seu envio é tratado</summary>
        <p>A contribuição é armazenada em planilha institucional do Google Sheets. O envio só é confirmado após a gravação ser conferida. Não constitui resposta no Google Forms nem comprova identidade.</p>
      </details>
      <fieldset disabled={state !== "editing"}>
        {[
          ["proposal", "Proposta (obrigatória)", 8000, "Descreva a ação ou mudança que você propõe para o assunto escolhido."],
          ["problem", "Problema (opcional)", 4000, "Que dificuldade ou necessidade a proposta procura atender?"],
          ["justification", "Justificativa (opcional)", 4000, "Explique por que a proposta é importante para a educação no município."],
        ].map(([name, label, limit, help]) => (
          <div key={name} className={name === "proposal" ? "proposal-field" : "support-field"}>
            <label htmlFor={name}>{label}</label>
            <p id={`${name}-help`} className="field-help">{help}</p>
            <textarea
              id={name}
              name={name}
              aria-describedby={`${name}-help ${name}-limit`}
              required={name === "proposal"}
              maxLength={limit}
              rows={name === "proposal" ? 6 : 3}
              value={fields[name]}
              onChange={(event) =>
                setFields({ ...fields, [name]: event.target.value })
              }
            />
            <small id={`${name}-limit`}>{fields[name].length} de {limit} caracteres.</small>
          </div>
        ))}
        <div hidden aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={fields.website}
            onChange={(event) =>
              setFields({ ...fields, website: event.target.value })
            }
          />
        </div>
      </fieldset>
      {state === "error" && (
        <p role="alert" tabIndex={-1} ref={message}>
          Não foi possível confirmar a gravação. Seu texto foi preservado. Tente
          novamente com o mesmo pedido, sem recarregar a página. Os campos ficam
          bloqueados para evitar alterar um envio possivelmente recebido.
        </p>
      )}
      {state === "recorded" ? (
        <p role="status" tabIndex={-1} ref={message}>
          Contribuição gravada e conferida na planilha. Protocolo: {receipt}
        </p>
      ) : (
        <button
          type="submit"
          disabled={
            state === "sending" ||
            (state === "editing" && !fields.proposal.trim())
          }
        >
          {state === "sending"
            ? "Confirmando gravação…"
            : state === "error"
              ? "Tentar confirmar novamente"
              : "Enviar contribuição"}
        </button>
      )}
      {state === "recorded" && (
        <button
          type="button"
          onClick={() => {
            attempt.current = null;
            setFields({
              problem: "",
              proposal: "",
              justification: "",
              website: "",
            });
            setReceipt("");
            setState("editing");
            requestAnimationFrame(() =>
              document.getElementById("proposal")?.focus(),
            );
          }}
        >
          Nova contribuição neste assunto
        </button>
      )}
    </form>
  );
}
