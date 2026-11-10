import { useMemo, useState } from 'react';

import { evaluate } from '../conditions.mjs';
import type { FieldDef, FieldErrors, FieldType, WireRecord } from '../types';
import { pendingReview } from './AgentFields';
import type { Suggested } from './payload';
import { defaultsOf } from '../fieldDefault';

/**
 * Valores de uma parte do assistente: começam com o que ele preencheu (sobre os defaults), seguem as condições dos
 * campos e guardam quais campos críticos o usuário já conferiu. `body` confere o obrigatório, como o backend.
 */
export default function useAgentValues(fields: FieldDef[], initial: WireRecord | undefined, suggested?: Suggested) {
  const [values, setValues] = useState<WireRecord>(() => ({
    ...defaultsOf(fields),
    ...initial
  }));
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Set<string>>(() => new Set());
  const types = useMemo(() => Object.fromEntries(fields.map((f) => [f.name, f.type])) as Record<string, FieldType>, [fields]);

  const visible = (f: FieldDef) => !f.visibleWhen || evaluate(f.visibleWhen, values, types);
  const required = (f: FieldDef) => Boolean(f.required) || Boolean(f.requiredWhen && evaluate(f.requiredWhen, values, types));
  const toReview = fields.filter((f) => visible(f) && pendingReview(f, suggested, confirmed)).map((f) => f.name);

  const change = (name: string, v: unknown) => {
    setValues((r) => ({ ...r, [name]: v }));
    setLocalErrors(({ [name]: _, ...others }) => others);
  };
  const confirm = (name: string) => setConfirmed((s) => new Set(s).add(name));

  /** O que vai ao servidor (reference vira id; campo escondido vai vazio), ou `undefined` com os erros na tela. */
  const body = (): WireRecord | undefined => {
    const local: Record<string, string> = {};
    const out: WireRecord = {};
    for (const f of fields) {
      const v = visible(f) ? (values[f.name] ?? null) : null;
      if (visible(f) && required(f) && (v === null || v === '')) local[f.name] = 'Campo obrigatório.';
      out[f.name] = f.type === 'reference' && v && typeof v === 'object' ? (v as { id: string }).id : v;
    }
    setLocalErrors(local);
    return Object.keys(local).length ? undefined : out;
  };

  /** Erro do campo: o local (obrigatório) ou o que o servidor mandou. */
  const error = (server: FieldErrors) => (name: string) => localErrors[name] ?? server[name]?.[0]?.message;

  return { values, change, visible, required, confirmed, confirm, toReview, body, error };
}
