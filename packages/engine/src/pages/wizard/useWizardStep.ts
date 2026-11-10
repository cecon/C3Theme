// Estado de um passo do assistente (#34): o rascunho do registro, as regras de campo do formulário, a validação e a
// gravação do passo (PATCH só dos campos dele, ou POST no primeiro, e a ação do passo depois).
import { useMemo, useState } from 'react';

import { ApiError } from '../../api';
import { evaluate } from '../../conditions.mjs';
import { useEngine } from '../../context';
import { toInput } from '../../formValues';
import { fieldTypes, fieldVisible, sectionGates } from '../../sectionVisibility';
import type { EntityDef, FieldDef, WireRecord } from '../../types';
import { stepErrors, stepFields, stepPatch, type WizardStepDef } from '../../wizard';

export function useWizardStep(def: EntityDef, saved: WireRecord | undefined, onSaved: () => Promise<unknown>) {
  const { client, entities } = useEngine();
  const [record, setRecord] = useState<WireRecord>(() => ({ ...saved }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const types = useMemo(() => fieldTypes(def), [def]);
  const gates = useMemo(() => sectionGates(def), [def]);

  const visible = (f: FieldDef) => fieldVisible(f, record, types, gates);
  const required = (f: FieldDef) => Boolean(f.required) || Boolean(f.requiredWhen && evaluate(f.requiredWhen, record, types));
  const locked = (f: FieldDef) => f.denied === 'readOnly' || (Boolean(saved) && Boolean(f.createOnly));
  const change = (name: string, value: unknown) => {
    setRecord((r) => ({ ...r, [name]: value }));
    setErrors(({ [name]: _, ...rest }) => rest);
  };

  /** Valida e grava o passo; devolve se deu certo. */
  async function save(step: WizardStepDef): Promise<boolean> {
    const fields = stepFields(def.fields, step);
    const local = stepErrors(fields, record, visible, required);
    setErrors(local);
    setFormError(undefined);
    if (Object.keys(local).length) return false;
    setBusy(true);
    try {
      const patch = stepPatch(
        fields,
        toInput(def, record, visible, (e) => entities[e]?.def)
      );
      const id = saved?.id ? String(saved.id) : undefined;
      const row = id ? await client.update(def.name, id, patch) : await client.create(def.name, patch);
      if (step.action) await client.action(def.name, String(row.id), step.action);
      await onSaved();
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(Object.fromEntries(Object.entries(e.fields).map(([k, v]) => [k, v[0].message])));
      setFormError(e instanceof Error ? e.message : 'Erro ao gravar o passo.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { record, errors, formError, busy, visible, required, locked, change, save };
}
