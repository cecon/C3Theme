import { useEffect, useRef, useState } from 'react';

import { notify } from '@c3theme/ui';
import { ApiError } from '../api';
import { documentError } from '../documents.mjs';
import { useEngine, useText } from '../context';
import { planFill, planUndo } from '../lookupFill';
import type { EntityDef, FieldDef, LookupDef, WireRecord } from '../types';

/** Botão de consulta ao lado de um campo (`trigger: 'button'`). */
export interface LookupButton {
  label: string;
  run: () => void;
  busy: boolean;
  /** O valor do campo ainda não é válido: consultar daria 422. */
  disabled: boolean;
}

/** Mesmas regras que o backend confere na origem: sem elas a consulta voltaria 422. */
function valid(f: FieldDef | undefined, v: unknown): v is string {
  if (!f || typeof v !== 'string' || v === '') return false;
  if (f.pattern && !new RegExp(f.pattern).test(v)) return false;
  return !f.format || documentError(f.format, v) === null;
}

/**
 * Consultar e preencher (`entity.lookups`). Só preenche campo vazio ou que ainda tem o valor da consulta
 * anterior: o que o usuário digitou fica. Cada preenchimento pode ser desfeito pelo aviso. Falha só avisa:
 * nunca impede salvar. Devolve, por campo, o botão de consulta (ou `undefined`).
 */
export default function useLookups(
  def: EntityDef | undefined,
  record: WireRecord,
  editing: boolean,
  patch: (values: WireRecord) => void
): (field: string) => LookupButton | undefined {
  const { client } = useEngine();
  const text = useText();
  const t = (id: string, defaultMessage: string) => text({ id: `c3.lookup.${id}`, defaultMessage });
  const lookups = def?.lookups ?? [];
  const field = (name: string) => def?.fields.find((f) => f.name === name);
  const [busy, setBusy] = useState<string[]>([]);
  const current = useRef(record);
  current.current = record;
  // o patch muda a cada render (filha guarda a lista do pai num closure): usa sempre o mais novo
  const patchRef = useRef(patch);
  patchRef.current = patch;
  // valor que a consulta pôs em cada campo, e o último valor de origem consultado (ou já presente ao abrir)
  const filled = useRef<WireRecord>({});
  const queried = useRef<Record<string, unknown>>({});

  async function run(l: LookupDef) {
    const value = current.current[l.field];
    if (!valid(field(l.field), value)) return;
    queried.current[l.name] = value;
    setBusy((b) => [...b, l.name]);
    try {
      const data = await client.lookup(def!.name, l.name, value);
      if (current.current[l.field] !== value) return; // o usuário já trocou o valor
      apply(l, data);
    } catch (e) {
      const notFound = e instanceof ApiError && e.status === 404;
      notify(e instanceof Error ? e.message : t('failed', 'Consulta indisponível.'), notFound ? 'info' : 'warning');
    } finally {
      setBusy((b) => b.filter((n) => n !== l.name));
    }
  }

  function apply(l: LookupDef, data: WireRecord) {
    const fill = planFill(l.fills, data, current.current, filled.current);
    const names = Object.keys(fill.patch);
    if (!names.length) return;
    Object.assign(filled.current, fill.patch);
    // um patch só: quem guarda a linha filha num closure perderia as mudanças intermediárias
    patchRef.current(fill.patch);
    const undo = () => {
      const back = planUndo(fill, current.current);
      Object.assign(filled.current, back);
      if (Object.keys(back).length) patchRef.current(back);
    };
    const labels = names.map((k) => text(field(k)?.label, k)).join(', ');
    notify(`${t('filled', 'Preenchido pela consulta')}: ${labels}.`, 'success', { label: t('undo', 'Desfazer'), onClick: undo });
  }

  // ao entrar em edição, o valor que já estava não dispara consulta
  useEffect(() => {
    filled.current = {};
    queried.current = Object.fromEntries(lookups.map((l) => [l.name, current.current[l.field]]));
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  // `trigger: 'change'`: consulta quando o valor fica válido e é novo, com uma pausa para o usuário terminar
  const sources = JSON.stringify(lookups.map((l) => record[l.field]));
  useEffect(() => {
    if (!editing) return;
    // valor incompleto no meio da digitação: voltar ao mesmo CEP depois consulta de novo
    for (const l of lookups) if (!valid(field(l.field), record[l.field])) queried.current[l.name] = record[l.field];
    const due = lookups.filter(
      (l) => l.trigger === 'change' && valid(field(l.field), record[l.field]) && record[l.field] !== queried.current[l.name]
    );
    if (!due.length) return;
    const timer = setTimeout(() => due.forEach(run), 400);
    return () => clearTimeout(timer);
  }, [sources, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (name) => {
    const l = editing ? lookups.find((x) => x.field === name && x.trigger !== 'change') : undefined;
    if (!l) return undefined;
    return {
      label: text(l.label, t('run', 'Consultar')),
      run: () => run(l),
      busy: busy.includes(l.name),
      disabled: !valid(field(l.field), record[l.field])
    };
  };
}
