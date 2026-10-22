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
function Subject({ context }) {
  return (
    <dl className="subject">
      <div>
        <dt>Grupo de trabalho</dt>
        <dd>{context.group}</dd>
      </div>
      <div>
        <dt>Objetivo</dt>
        <dd>{context.objective}</dd>
      </div>
      <div>
        <dt>Modalidade</dt>
        <dd>{context.mode}</dd>
      </div>
      {context.strategy && (
        <div>
          <dt>Estratégia</dt>
          <dd>{context.strategy.split(":")[0]}</dd>
        </div>
      )}
    </dl>
  );
}
export function App() {
  const [collection, setCollection] = useState("closed");
  const enabled = collection === "open";
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
    setCollection("checking");
    const controller = new AbortController();
    fetch("/api/collection", {
      signal: controller.signal,
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Status indisponível");
        const result = await response.json();
        if (typeof result.enabled !== "boolean") throw new Error("Status inválido");
        setCollection(result.enabled ? "open" : "closed");
      })
      .catch(() => {
        if (!controller.signal.aborted) setCollection("unavailable");
      });
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
        <p className="notice" aria-live="polite">
          {collection === "checking"
            ? "Verificando disponibilidade da coleta. A consulta ao catálogo está disponível."
            : collection === "unavailable"
              ? "Não foi possível verificar a disponibilidade da coleta. Consulte o catálogo e tente recarregar a página antes de começar a escrever."
              : enabled
                ? "Coleta aberta. Consulte o conteúdo e envie sua contribuição."
                : "Coleta ainda não aberta. Consulte o catálogo."}
        </p>
        {!ready && (
          <p>
            O fluxo interativo precisa de JavaScript. Consulte o texto integral
            abaixo; contribuições estão indisponíveis.
          </p>
        )}
        <ol className="steps" aria-label="Etapas da participação">
          <li aria-current={!selected && !bound ? "step" : undefined}>
            Escolha o assunto
          </li>
          <li aria-current={selected && !bound ? "step" : undefined}>
            Consulte o conteúdo
          </li>
          <li aria-current={bound ? "step" : undefined}>
            Escreva sua contribuição
          </li>
        </ol>
        <div className="workspace">
        <div className="selection">
        <section aria-labelledby="grupo">
          <h2 id="grupo">1. Escolha o assunto</h2>
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
          <section aria-label="Detalhes do assunto">
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
              </>
            )}
          </section>
        )}
        </div>
        <section className="content-pane" aria-labelledby="leitura">
          <h2 id="leitura">2. Consulte o conteúdo</h2>
          {selected ? (
            <>
              <p className="eyebrow">Conteúdo em consulta · {selected.label}</p>
              <p className="reading-guide">{mode === "Geral" ? "Objetivo e metas na íntegra. Para consultar uma estratégia, altere a modalidade de contribuição." : "Estratégias pertencem ao objetivo, sem associação individual com metas."}</p>
                <article
                  className="reading"
                  aria-label="Texto legal selecionado"
                >
                  {mode === "Geral" ? (
                    <>
                      <Legal row={selected} />
                      <h3>Metas do objetivo</h3>
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
          ) : (
            <div className="empty-state">
              <h3>Um assunto de cada vez</h3>
              <p>Escolha um grupo de trabalho e um objetivo para consultar o texto integral do PNE.</p>
              <p>Depois da leitura, prepare sua contribuição para o Plano Municipal de Educação.</p>
            </div>
          )}
        </section>
        <section className="contribution-pane" aria-labelledby="preparar">
          <h2 id="preparar">3. Escreva sua contribuição</h2>
          {current && (!bound || !sameContext(bound, current)) && (
            <div className="prepare">
            <p>{bound ? "Você está consultando outro assunto. O formulário abaixo mantém o assunto original." : "Confira o assunto antes de começar a escrever."}</p>
            <Subject context={current} />
            <button
              disabled={!enabled || sameContext(bound, current)}
              onClick={prepare}
            >
              {bound
                ? "Alterar o assunto da contribuição"
                : "Preparar contribuição"}
            </button>
            {!enabled && <p className="help">A contribuição depende da abertura da coleta.</p>}
            </div>
          )}
          {!current && !bound && <p className="help">Selecione o assunto e consulte o conteúdo para preparar sua contribuição.</p>}
        {bound && (
          <div className="bound-form">
            <h3>Assunto da contribuição</h3>
            <Subject context={bound} />
            <p className="help">Você pode consultar outros conteúdos sem perder este rascunho. Para substituí-lo, escolha outro assunto e confirme a alteração.</p>
            <ContributionForm key={JSON.stringify(bound)} context={bound} />
          </div>
        )}
        </section>
        </div>
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
