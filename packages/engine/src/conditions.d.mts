export type FieldType =
  'string' | 'text' | 'email' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'enum' | 'flags' | 'reference' | 'file';

export type Condition =
  | { and: Condition[] }
  | { or: Condition[] }
  | { not: Condition }
  | { field: string; op: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'contains' | 'null'; value: unknown };

export const OPS_BY_TYPE: Record<FieldType, string[]>;
export function evaluate(cond: Condition, record: Record<string, unknown>, types: Record<string, FieldType>): boolean;
export function conditionFields(cond: Condition): Generator<{ field: string; op: string; value: unknown }>;
export function resolveFilter(cond: Condition, record: Record<string, unknown>): Condition | null;
