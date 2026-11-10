// Campo de uma entidade (ou do input de uma ação): o JSON da spec e a forma tipada que o motor usa para validar,
// gravar e consultar.

import { type Access, isFreeAccess, parseAccess } from './access';
import type { Condition } from './condition';
import { DOC_FORMATS, type DocFormat } from './document';
import { MAX_FILE_SIZE, UPLOAD_CEILING } from './file';
import { BRANCH_COL, COMPANY_COL, FIELD_TYPES, type FieldType, type Rec, type SqlValue, isObject } from './types';
import { parseOptions } from './value';

export interface Field {
  name: string;
  type: FieldType;
  required: boolean;
  readOnly: boolean;
  /** Senha, PIN: só se grava. Nunca sai do banco pelo motor (leitura traz `null`), não filtra, não ordena. */
  writeOnly: boolean;
  /** Só se informa na criação: na alteração, mudar o valor é 422 `read_only`. */
  createOnly: boolean;
  unique: boolean;
  default?: unknown;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  /** CPF/CNPJ com dígito verificador, telefone. */
  format?: DocFormat;
  min?: number;
  max?: number;
  scale: number;
  options: SqlValue[];
  reference?: string;
  /** `file`: extensões aceitas, minúsculas e com ponto (`.pfx`); vazio aceita qualquer uma. */
  accept: string[];
  /** `file`: tamanho máximo em bytes, depois de decodificado. */
  maxSize: number;
  visibleWhen?: Condition;
  requiredWhen?: Condition;
  /** Trava o campo na alteração quando vale para o registro como está gravado. */
  readOnlyWhen?: Condition;
  /** Só em reference: condição sobre a entidade apontada, ainda em JSON (os `{"$field"}` vêm do registro). */
  refFilter?: unknown;
  /** Códigos de permissão para ver e para alterar (somado ao da seção). */
  access: Access;
}

/** visibleWhen/requiredWhen/readOnlyWhen de cada campo (pelo índice), ainda em JSON. */
export type FieldConditions = [number, unknown, unknown, unknown][];

/** O `id` implícito, como uma condição o enxerga: um reference (string no fio, inteiro na coluna). */
export const ID_FIELD: Field = {
  name: 'id',
  type: 'reference',
  required: false,
  readOnly: true,
  writeOnly: false,
  createOnly: false,
  unique: true,
  scale: 0,
  options: [],
  accept: [],
  maxSize: 0,
  access: { view: [], edit: [] }
};

/** O que só vale num registro gravado, nunca no input de uma ação. */
export const onlyForRecords = (f: Field): boolean => f.readOnly || f.createOnly || f.refFilter !== undefined || !isFreeAccess(f.access);

const bool = (raw: Rec, k: string): boolean => raw[k] === true;
const num = (raw: Rec, k: string): number | undefined => (typeof raw[k] === 'number' ? (raw[k] as number) : undefined);
const str = (raw: Rec, k: string): string | undefined => (typeof raw[k] === 'string' ? (raw[k] as string) : undefined);
const opt = (raw: Rec, k: string): unknown => (raw[k] === null ? undefined : raw[k]);

function checkRaw(owner: string, f: Rec, type: FieldType): void {
  const name = f.name as string;
  const at = `${owner}.${name}`;
  if (bool(f, 'writeOnly')) {
    if (type !== 'string') throw new Error(`${at}: writeOnly só vale para type string`);
    if (bool(f, 'readOnly') || bool(f, 'unique') || opt(f, 'default') !== undefined)
      throw new Error(`${at}: writeOnly não combina com readOnly, unique nem default`);
  }
  if (opt(f, 'format') !== undefined && type !== 'string') throw new Error(`${at}: format só vale para type string`);
  if (type === 'flags') {
    const opts = Array.isArray(f.options) ? f.options : [];
    const bit = (o: unknown) => {
      const v = isObject(o) ? o.value : undefined;
      return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 2 ** 30 && (v & (v - 1)) === 0;
    };
    if (!opts.length || !opts.every(bit)) throw new Error(`${at}: opções de flags são potências de 2 (1, 2, 4...)`);
  }
  const accept = Array.isArray(f.accept) ? (f.accept as unknown[]) : [];
  if (type !== 'file') {
    if (accept.length || opt(f, 'maxSize') !== undefined) throw new Error(`${at}: accept/maxSize só valem para type file`);
  } else {
    if (accept.some((e) => typeof e !== 'string' || !e.startsWith('.') || e.length < 2))
      throw new Error(`${at}: accept lista extensões com ponto (".pfx")`);
    const max = num(f, 'maxSize');
    if (max !== undefined && (max <= 0 || max > UPLOAD_CEILING)) throw new Error(`${at}: maxSize entre 1 e ${UPLOAD_CEILING} bytes`);
    if (bool(f, 'unique') || opt(f, 'default') !== undefined || bool(f, 'writeOnly') || opt(f, 'format') !== undefined)
      throw new Error(`${at}: file não combina com unique, default, writeOnly nem format`);
  }
  if (opt(f, 'filter') !== undefined && type !== 'reference') throw new Error(`${at}: filter só vale para type reference`);
  if (bool(f, 'readOnly') && (bool(f, 'createOnly') || opt(f, 'readOnlyWhen') !== undefined))
    throw new Error(`${at}: createOnly e readOnlyWhen não combinam com readOnly`);
  if (opt(f, 'access') !== undefined && bool(f, 'required') && opt(f, 'default') === undefined)
    throw new Error(`${at}: campo com access e required precisa de default`);
}

/** Primeira passada: estrutura e tipos. As condições voltam em JSON, resolvidas depois com todos os campos. */
export function parseFields(owner: string, raw: unknown[], ident: (n: string) => boolean): [Field[], FieldConditions] {
  const fields: Field[] = [];
  const conditions: FieldConditions = [];
  raw.forEach((item, i) => {
    if (!isObject(item)) throw new Error(`${owner}: campo ${i} precisa ser um objeto`);
    const name = str(item, 'name') ?? '';
    if (!ident(name) || ['id', COMPANY_COL, BRANCH_COL].includes(name)) throw new Error(`${owner}: nome de campo inválido '${name}'`);
    if (fields.some((x) => x.name === name)) throw new Error(`${owner}: campo '${name}' repetido`);
    const type = item.type as FieldType;
    if (!FIELD_TYPES.includes(type)) throw new Error(`${owner}.${name}: tipo desconhecido '${String(item.type)}'`);
    checkRaw(owner, item, type);
    const format = opt(item, 'format');
    if (format !== undefined && !DOC_FORMATS.includes(format as DocFormat))
      throw new Error(`${owner}.${name}: format desconhecido '${String(format)}'`);
    const pattern = str(item, 'pattern');
    let re: RegExp | undefined;
    if (pattern !== undefined) {
      try {
        re = new RegExp(`^(?:${pattern})$`, 'u');
      } catch (e) {
        throw new Error(`${owner}.${name}: pattern inválido: ${(e as Error).message}`, { cause: e });
      }
    }
    let options: SqlValue[];
    try {
      options = parseOptions((Array.isArray(item.options) ? item.options : []).map((o) => (isObject(o) ? o.value : o)));
    } catch (e) {
      throw new Error(`${owner}.${name}: ${(e as Error).message}`, { cause: e });
    }
    conditions.push([i, opt(item, 'visibleWhen'), opt(item, 'requiredWhen'), opt(item, 'readOnlyWhen')]);
    fields.push({
      name,
      type,
      required: bool(item, 'required'),
      readOnly: bool(item, 'readOnly'),
      writeOnly: bool(item, 'writeOnly'),
      createOnly: bool(item, 'createOnly'),
      unique: bool(item, 'unique'),
      default: opt(item, 'default'),
      minLength: num(item, 'minLength'),
      maxLength: num(item, 'maxLength'),
      pattern: re,
      format: format as DocFormat | undefined,
      min: num(item, 'min'),
      max: num(item, 'max'),
      scale: num(item, 'scale') ?? 2,
      options,
      reference: str(item, 'entity'),
      accept: (Array.isArray(item.accept) ? (item.accept as string[]) : []).map((e) => e.toLowerCase()),
      maxSize: num(item, 'maxSize') ?? MAX_FILE_SIZE,
      refFilter: opt(item, 'filter'),
      access: parseAccess(item.access)
    });
  });
  return [fields, conditions];
}
