// Condições da spec (visibleWhen, presets, rowAccess, where de widget): campos, operadores e o formato trafegado
// de cada valor. Separado de validate-spec.mjs para ele caber nas 300 linhas.

import { OPS_BY_TYPE, conditionFields } from '../packages/engine/src/conditions.mjs';
import { isRelative, relativeError } from './spec-dates.mjs';
import { notWriteOnly } from './spec-fields.mjs';

// ---- formato trafegado de cada tipo (spec/README.md#tipos-de-campo-e-formato-trafegado) ----

export const WIRE = {
  string: (v) => typeof v === 'string',
  text: (v) => typeof v === 'string',
  email: (v) => typeof v === 'string',
  enum: (v) => (typeof v === 'string' && v !== '') || Number.isSafeInteger(v),
  flags: (v) => Number.isSafeInteger(v) && v >= 0,
  reference: (v) => typeof v === 'string',
  file: () => false,
  boolean: (v) => typeof v === 'boolean',
  integer: (v) => Number.isSafeInteger(v),
  decimal: (v) => typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v),
  date: (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v),
  datetime: (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v)
};

/** Confere uma condição contra os campos (`relative`: aceita data relativa, só em filtro); erros em `errors`. */
export const makeCheckCondition =
  (errors) =>
  (cond, fields, where, relative = false) => {
    for (const { field, op, value } of conditionFields(cond)) {
      // `id` é o id implícito do registro, um reference
      const f = field === 'id' ? { name: 'id', type: 'reference' } : fields.get(field);
      if (!f) {
        errors.push(`${where}: condição cita campo inexistente '${field}'`);
        continue;
      }
      notWriteOnly(f, where, errors);
      if (!OPS_BY_TYPE[f.type].includes(op)) errors.push(`${where}: operador '${op}' não vale para '${field}' (${f.type})`);
      else if (relative && isRelative(value)) {
        const e = relativeError(value, f.type, op);
        if (e) errors.push(`${where}: '${field}': ${e}`);
      } else if (op === 'null') {
        if (typeof value !== 'boolean') errors.push(`${where}: 'null' espera true/false`);
      } else {
        const values = op === 'in' ? value : [value];
        if (!Array.isArray(values) || values.some((v) => !WIRE[f.type](v)))
          errors.push(`${where}: valor de '${field}' fora do formato trafegado de ${f.type}`);
        if (f.type === 'enum' && values.some((v) => !f.options.some((o) => o.value === v)))
          errors.push(`${where}: valor de '${field}' não está em options`);
      }
    }
  };
