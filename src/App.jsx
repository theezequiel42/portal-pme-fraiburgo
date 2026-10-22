import React, { useEffect, useRef, useState } from "react";
import { StrategyCombobox } from "./StrategyCombobox.jsx";
import catalog from "../data/pne-catalog.json";
import { groups, contextFor, sameContext } from "./domain.js";
import { ContributionForm } from "./ContributionForm.jsx";
function Legal({ row }) {
  return (
    <p data-legal={row.label}>
      <strong>{row.label}</strong>
      {" — "}
      {row.text}
    </p>
  );
}
export function App() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false),
    [group, setGroup] = useState(""),
    [objective, setObjective] = useState(""),
    [mode, setMode] = useState("Geral"),
    [strategy, setStrategy] = useState("");
  const [bound, setBound] = useState(null),
    [pending, setPending] = useState(null);
  const dialog = useRef(null),
    trigger = useRef(null);
  useEffect(() => {
    setReady(true);
    const controller = new AbortController();
    fetch("/api/collection", {
      signal: controller.signal,
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (response.ok) setEnabled((await response.json()).enabled === true);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (pending) dialog.current?.showModal();
  }, [pending]);
  const selected = catalog.objectives.find((o) => o.id === Number(objective));
  const chosen = selected?.strategies.find((s) => s.id === strategy);
  const current = contextFor(catalog, group, objective, mode, strategy);

  function prepare(e) {
    trigger.current = e.currentTarget;
    if (bound && !sameContext(bound, current)) setPending(current);
    else if (!bound) setBound(current);
  }
  function close(confirm) {
    if (confirm) setBound(pending);
    dialog.current.close();
    setPending(null);
    trigger.current?.focus();
  }
  return (
    <>
      <a className="skip" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header>
        <span className="brand">
          <img
            src="/brand/sme-fraiburgo.png"
            alt="Fraiburgo — Secretaria de Educação"
            width="7342"
            height="1000"
          />
        </span>
      </header>
      <main id="conteudo">
        <h1>PME Fraiburgo</h1>
        <p className="intro">
          Consulte o PNE para contribuir com o Plano Municipal de Educação.
        </p>
        <p className="notice">
          {enabled
            ? "Formulário disponível. Confira o assunto antes de preparar sua contribuição."
            : "Coleta ainda não aberta. Consulte o catálogo."}
        </p>
        {!ready && (
          <p>
            O fluxo interativo precisa de JavaScript. Consulte o texto integral
            abaixo; contribuições estão indisponíveis.
          </p>
        )}
        <section aria-labelledby="grupo">
          <h2 id="grupo">1. Escolha sua área</h2>
          <label htmlFor="group">Grupo de trabalho</label>
          <select
            id="group"
            disabled={!ready}
            value={group}
            onChange={(e) => {
              setGroup(e.target.value);
              setObjective("");
              setMode("Geral");
              setStrategy("");
            }}
          >
            <option value="">Selecione uma área</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.id} | {g.name}
              </option>
            ))}
          </select>
        </section>
        {group && (
          <section aria-labelledby="leitura">
            <h2 id="leitura">2. Escolha o objetivo e consulte o conteúdo</h2>
            <label htmlFor="objective">Objetivo</label>
            <select
              id="objective"
              value={objective}
              onChange={(e) => {
                setObjective(e.target.value);
                setMode("Geral");
                setStrategy("");
              }}
            >
              <option value="">Selecione um objetivo</option>
              {catalog.objectives
                .filter((o) =>
                  groups.find((g) => g.id === group).objectives.includes(o.id),
                )
                .map((o) => (
                  <option value={o.id} key={o.id}>
                    {o.label} — {o.text}
                  </option>
                ))}
            </select>
            {selected && (
              <>
                <fieldset>
                  <legend>Modalidade de contribuição</legend>
                  {["Geral", "Estratégia"].map((m) => (
                    <label className="radio" key={m}>
                      <input
                        type="radio"
                        aria-describedby={`mode-${m}`}
                        aria-label={m}
                        name="mode"
                        value={m}
                        checked={mode === m}
                        onChange={() => {
                          setMode(m);
                          setStrategy("");
                        }}
                      />
                      <span>{m}</span>
                      <span id={`mode-${m}`} className="mode-description">
                        {m === "Geral"
                          ? "Sugestões sobre o conjunto de estratégias do objetivo."
                          : "Sugestão sobre uma estratégia específica."}
                      </span>
                    </label>
                  ))}
                </fieldset>
                {mode === "Estratégia" && (
                  <StrategyCombobox
                    key={`${group}-${objective}`}
                    strategies={selected.strategies}
                    value={strategy}
                    onChange={setStrategy}
                  />
                )}
                <article
                  className="reading"
                  aria-label="Texto legal selecionado"
                >
                  {mode === "Geral" ? (
                    <>
                      <Legal row={selected} />
                      {selected.goals.map((g) => (
                        <Legal key={g.id} row={g} />
                      ))}
                    </>
                  ) : !chosen ? (
                    <p>Selecione uma estratégia para ler o texto integral.</p>
                  ) : (
                    selected.strategies
                      .filter((s) => s.id === strategy)
                      .map((s) => <Legal key={s.id} row={s} />)
                  )}
                </article>
              </>
            )}
          </section>
        )}
        {current && (
          <section aria-labelledby="preparar">
            <h2 id="preparar">3. Prepare sua contribuição</h2>
            <p>
              {current.group} · {current.objective} · {current.mode}
              {chosen && mode === "Estratégia"
                ? ` · ${chosen.label}`
                : ""}.{" "}
              {enabled
                ? "Prepare a contribuição para escrever no formulário."
                : "Consulte o conteúdo enquanto aguarda a abertura."}
            </p>
            <p>
              {enabled
                ? "Escreva sua contribuição aqui no portal. A gravação na planilha será confirmada pelo servidor."
                : "O formulário será disponibilizado após as verificações e aprovações institucionais."}
            </p>
            <button
              disabled={!enabled || sameContext(bound, current)}
              onClick={prepare}
            >
              {bound
                ? "Alterar o assunto da contribuição"
                : "Preparar contribuição"}
            </button>
          </section>
        )}
        {bound && (
          <section aria-labelledby="enviar">
            <h2 id="enviar">Enviar contribuição</h2>
            <p>
              Assunto da contribuição: {bound.group} · {bound.objective} ·{" "}
              {bound.mode}
              {bound.strategy && ` · ${bound.strategy.split(":")[0]}`}
            </p>
            <p>
              A navegação de leitura preserva este formulário e seu assunto
              original. Alterar o assunto exige confirmação e descarta o
              rascunho atual.
            </p>
            <ContributionForm key={JSON.stringify(bound)} context={bound} />
          </section>
        )}
        <dialog
          ref={dialog}
          onCancel={(e) => {
            e.preventDefault();
            close(false);
          }}
          aria-labelledby="confirm-title"
        >
          <h2 id="confirm-title">Alterar o assunto da contribuição?</h2>
          {pending && (
            <p>
              {pending.group} · {pending.objective} · {pending.mode}
              {pending.strategy && ` · ${pending.strategy.split(":")[0]}`}
            </p>
          )}
          <p>
            O texto deste formulário será descartado ao alterar o assunto. Não
            há salvamento automático. Se houver envio sem confirmação, tente
            confirmar novamente antes de iniciar outro pedido.
          </p>
          <button autoFocus onClick={() => close(false)}>
            Cancelar e preservar formulário
          </button>
          <button className="danger" onClick={() => close(true)}>
            Confirmar alteração do assunto
          </button>
        </dialog>
        <details className="catalog">
          <summary>
            Consultar catálogo legal completo · 19 objetivos, 73 metas e 372
            estratégias
          </summary>
          <p>
            Transcrição do Anexo I. Estratégias pertencem ao objetivo, sem
            associação inferida com metas. Os nomes das áreas são rótulos
            editoriais.
          </p>
          <p>
            Fonte:{" "}
            <a href={catalog.source.url}>
              {catalog.source.law}, {catalog.source.annex}
            </a>
          </p>
          {catalog.objectives.map((o) => (
            <section key={o.id}>
              <h2>{o.label}</h2>
              <Legal row={o} />
              <h3>Metas</h3>
              {o.goals.map((g) => (
                <Legal key={g.id} row={g} />
              ))}
              <h3>Estratégias do objetivo</h3>
              {o.strategies.map((s) => (
                <Legal key={s.id} row={s} />
              ))}
            </section>
          ))}
        </details>
      </main>
      <footer>
        Município de Fraiburgo · Secretaria Municipal de Educação
        <br />
        {enabled
          ? "Contribuições registradas em planilha institucional do Google Sheets."
          : "Consulta demonstrativa. Nenhuma contribuição é coletada nesta versão."}
      </footer>
    </>
  );
}
