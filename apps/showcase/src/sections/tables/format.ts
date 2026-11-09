import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2, useGrouping: false });

export const formatarMoeda = (valor: number) => moeda.format(valor);
export const formatarNumero = (valor: number) => inteiro.format(valor);
export const formatarData = (iso: string) => format(parseISO(iso), 'dd/MM/yyyy', { locale: ptBR });
export const formatarDataLonga = (iso: string) => format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

/** Remove acentos e caixa para buscas ("joao" encontra "João"). */
export function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export type ValorCsv = string | number | boolean | null | undefined;

function celulaCsv(valor: ValorCsv) {
  if (valor === null || valor === undefined) return '';
  const texto = typeof valor === 'number' ? decimal.format(valor) : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * Gera e baixa um CSV no navegador, sem biblioteca. Usa ";" como separador e BOM UTF-8,
 * que é como o Excel em português abre o arquivo direto com acentos e colunas certas.
 */
export function baixarCsv(arquivo: string, cabecalhos: string[], linhas: ValorCsv[][]) {
  const texto = [cabecalhos, ...linhas].map((linha) => linha.map(celulaCsv).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = arquivo.endsWith('.csv') ? arquivo : `${arquivo}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
