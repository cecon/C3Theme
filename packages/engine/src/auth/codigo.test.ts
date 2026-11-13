import { describe, expect, it } from 'vitest';
import { codigoCompleto, codigoDoErro, mensagemDoCodigo, pedeNovoCodigo, textoDaEspera } from './codigo';

describe('leitura do erro da entrada por código (#123)', () => {
  it('reconhece os códigos estáveis dos estados de falha', () => {
    expect(codigoDoErro(Object.assign(new Error('x'), { code: 'codigo-invalido' }))).toBe('codigo-invalido');
    expect(codigoDoErro({ codigo: 'codigo-expirado' })).toBe('codigo-expirado');
    expect(codigoDoErro(Object.assign(new Error('x'), { code: 'muitas-tentativas' }))).toBe('muitas-tentativas');
    expect(codigoDoErro(Object.assign(new Error('x'), { code: 'sem-rede' }))).toBe('sem-rede');
    expect(codigoDoErro(Object.assign(new Error('x'), { code: 'outro' }))).toBeUndefined();
    expect(codigoDoErro('falha')).toBeUndefined();
  });

  it('traduz cada estado para PT-BR e mantém a mensagem da porta quando o código é desconhecido', () => {
    expect(mensagemDoCodigo(Object.assign(new Error('x'), { code: 'codigo-invalido' }))).toBe(
      'Código inválido. Confira os dígitos e tente de novo.'
    );
    expect(mensagemDoCodigo(Object.assign(new Error('x'), { code: 'codigo-expirado' }))).toBe('O código expirou. Peça um novo código.');
    expect(mensagemDoCodigo(Object.assign(new Error('x'), { code: 'muitas-tentativas' }))).toBe(
      'Muitas tentativas. Peça um novo código e tente mais tarde.'
    );
    expect(mensagemDoCodigo(Object.assign(new Error('x'), { code: 'sem-rede' }))).toBe(
      'Sem conexão com o servidor. Verifique a rede e tente de novo.'
    );
    expect(mensagemDoCodigo(new Error('Falha do sistema.'))).toBe('Falha do sistema.');
    expect(mensagemDoCodigo(undefined)).toBe('Algo deu errado. Tente de novo.');
  });

  it('só expirado e muitas tentativas pedem código novo', () => {
    expect(pedeNovoCodigo({ code: 'codigo-expirado' })).toBe(true);
    expect(pedeNovoCodigo({ code: 'muitas-tentativas' })).toBe(true);
    expect(pedeNovoCodigo({ code: 'codigo-invalido' })).toBe(false);
    expect(pedeNovoCodigo({ code: 'sem-rede' })).toBe(false);
    expect(pedeNovoCodigo(new Error('x'))).toBe(false);
  });

  it('espera e completude do código', () => {
    expect(textoDaEspera(30)).toBe('Reenviar em 30s');
    expect(codigoCompleto('123456')).toBe(true);
    expect(codigoCompleto('12345')).toBe(false);
    expect(codigoCompleto('12345a')).toBe(false);
  });
});
