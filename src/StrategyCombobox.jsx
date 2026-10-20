import React, { useEffect, useId, useRef, useState } from "react";
import { filterStrategies } from "./domain.js";

export function StrategyCombobox({ strategies, value, onChange }) {
  const id = useId();
  const root = useRef(null);
  const input = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const chosen = strategies.find((s) => s.id === value);
  const results = filterStrategies(strategies, query);
  const display = (s) => (s ? `${s.label} — ${s.text}` : "");
  const optionId = (s) => `${id}-option-${s.id}`;
  function close() {
    setOpen(false);
    setQuery("");
    setActive(-1);
  }
  function expand() {
    setOpen(true);
    setQuery("");
    setActive(-1);
    input.current?.focus();
  }
  function choose(s) {
    onChange(s.id);
    close();
    input.current?.focus();
  }
  useEffect(() => {
    function outside(e) {
      if (!root.current?.contains(e.target)) close();
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  // Keep the field and its results visible when opened near the viewport edge.
  // Scrolling changes neither keyboard focus nor the confirmed selection.
  useEffect(() => {
    if (open) root.current?.scrollIntoView({ block: "nearest" });
  }, [open, query]);
  useEffect(() => {
    if (open && results[active]) {
      document
        .getElementById(optionId(results[active]))
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [open, active, query]);
  return (
    <div
      ref={root}
      className="strategy-combobox"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) close();
      }}
    >
      <label htmlFor={`${id}-input`}>Estratégia</label>
      <div className="strategy-control">
        <input
          ref={input}
          id={`${id}-input`}
          role="combobox"
          type="text"
          autoComplete="off"
          placeholder="Digite uma palavra ou escolha na lista"
          value={open ? query : display(chosen)}
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-describedby={`${id}-status`}
          aria-activedescendant={
            open && results[active] ? optionId(results[active]) : undefined
          }
          onFocus={(e) => e.currentTarget.select()}
          onClick={() => {
            if (!open) expand();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              const count = (open ? results : strategies).length;
              setActive((previous) =>
                count
                  ? previous < 0
                    ? e.key === "ArrowDown"
                      ? 0
                      : count - 1
                    : (previous + (e.key === "ArrowDown" ? 1 : -1) + count) %
                      count
                  : -1,
              );
            } else if (e.key === "Enter" && open) {
              e.preventDefault();
              if (results[active]) choose(results[active]);
            } else if (e.key === "Escape" && open) {
              e.preventDefault();
              close();
            } else if (e.key === "Tab") close();
          }}
        />
        {open && query && (
          <button
            type="button"
            tabIndex={-1}
            className="strategy-action"
            aria-label="Limpar pesquisa"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => {
              setQuery("");
              setActive(-1);
              input.current?.focus();
            }}
          >
            ×
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          className="strategy-action"
          aria-label={
            open ? "Fechar lista de estratégias" : "Abrir lista de estratégias"
          }
          aria-controls={`${id}-list`}
          aria-expanded={open}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) close();
            else expand();
            input.current?.focus();
          }}
        >
          ⌄
        </button>
      </div>
      <div
        id={`${id}-list`}
        role="listbox"
        aria-label="Estratégias do objetivo"
        className="strategy-list"
        hidden={!open}
      >
        {open &&
          results.map((s, index) => (
            <div
              id={optionId(s)}
              key={s.id}
              role="option"
              aria-selected={s.id === value}
              className={index === active ? "highlighted" : ""}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(s)}
            >
              {display(s)}
            </div>
          ))}
        {open && results.length === 0 && (
          <p>Nenhum resultado. Tente outra palavra ou identificador.</p>
        )}
      </div>
      <p id={`${id}-status`} role="status" className="strategy-status">
        {open
          ? `${results.length} ${results.length === 1 ? "estratégia encontrada" : "estratégias encontradas"}.`
          : "Digite para pesquisar ou abra a lista de estratégias."}
        {open &&
          query &&
          chosen &&
          " A seleção anterior está preservada na leitura enquanto você pesquisa."}
      </p>
    </div>
  );
}
