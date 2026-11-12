import { describe, expect, it } from 'vitest';

import {
  addressParts,
  browserDecision,
  clampPoint,
  decideBrowser,
  isBrowserCheckpoint,
  normalizeAddress,
  safeFrame,
  safeUrl
} from './hitlBrowser';

describe('safeUrl', () => {
  it('só http e https', () => {
    expect(safeUrl('https://a.com/x')?.host).toBe('a.com');
    expect(safeUrl('http://a.com')?.protocol).toBe('http:');
    expect(safeUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeUrl('file:///etc/passwd')).toBeUndefined();
    expect(safeUrl('não é url')).toBeUndefined();
    expect(safeUrl(3)).toBeUndefined();
  });
});

describe('safeFrame', () => {
  it('imagem embutida ou endereço', () => {
    expect(safeFrame('data:image/png;base64,AAA')).toBe('data:image/png;base64,AAA');
    expect(safeFrame('data:image/webp;base64,AAA')).toBe('data:image/webp;base64,AAA');
    expect(safeFrame('https://cdn/x.png')).toBe('https://cdn/x.png');
    expect(safeFrame('/capturas/1.png')).toBe('/capturas/1.png');
    expect(safeFrame('//outro.com/x.png')).toBeUndefined();
    expect(safeFrame('/\\outro.com/x.png')).toBeUndefined();
    expect(safeFrame('data:text/html;base64,AAA')).toBeUndefined();
    expect(safeFrame('xdata:image/png;base64,AAA')).toBeUndefined();
    expect(safeFrame('javascript:1')).toBeUndefined();
    expect(safeFrame(undefined)).toBeUndefined();
    expect(safeFrame({ toString: () => 'https://a.com/x.png' })).toBeUndefined();
  });
});

describe('addressParts', () => {
  it('separa o domínio do resto', () => {
    expect(addressParts('https://loja.com/carrinho?x=1#f')).toEqual({ host: 'loja.com', rest: '/carrinho?x=1#f', secure: true });
    expect(addressParts('http://loja.com/')).toEqual({ host: 'loja.com', rest: '', secure: false });
    expect(addressParts('ftp://x')).toBeUndefined();
  });
});

describe('normalizeAddress', () => {
  it('põe https quando falta', () => {
    expect(normalizeAddress(' loja.com/x ')).toBe('https://loja.com/x');
    expect(normalizeAddress('http://a.com')).toBe('http://a.com/');
    expect(normalizeAddress('a.com/x?y=b:c')).toBe('https://a.com/x?y=b:c');
    expect(normalizeAddress('javascript:alert(1)')).toBeUndefined();
    expect(normalizeAddress('duas palavras')).toBeUndefined();
    expect(normalizeAddress('  ')).toBeUndefined();
  });
});

describe('clampPoint', () => {
  it('prende entre 0 e 100', () => {
    expect(clampPoint({ x: -5, y: 120 })).toEqual({ x: 0, y: 100 });
    expect(clampPoint({ x: 30, y: 40 })).toEqual({ x: 30, y: 40 });
    expect(clampPoint({ x: Number.NaN, y: 1 })).toBeUndefined();
    expect(clampPoint({ x: 1, y: Number.POSITIVE_INFINITY })).toBeUndefined();
    expect(clampPoint(undefined)).toBeUndefined();
  });
});

describe('decisão', () => {
  const part = (result: unknown) => ({ id: 'p', kind: 'c3.browser', payload: {}, result });
  it('vai e volta', () => {
    expect(decideBrowser('takeover')).toEqual({ action: 'accept', values: { decision: 'takeover' } });
    expect(browserDecision(part({ decision: 'allow' }))).toBe('allow');
    expect(browserDecision(part({ decision: 'takeover' }))).toBe('takeover');
    expect(browserDecision(part({ decision: 'x' }))).toBeUndefined();
    expect(browserDecision(part(null))).toBeUndefined();
  });
});

describe('isBrowserCheckpoint', () => {
  it('precisa de endereço seguro e intenção', () => {
    expect(isBrowserCheckpoint({ url: 'https://a.com', intent: 'Enviar' })).toBe(true);
    expect(isBrowserCheckpoint({ url: 'javascript:1', intent: 'Enviar' })).toBe(false);
    expect(isBrowserCheckpoint({ url: 'https://a.com', intent: ' ' })).toBe(false);
    expect(isBrowserCheckpoint({ url: 'https://a.com' })).toBe(false);
    expect(isBrowserCheckpoint('x')).toBe(false);
  });
});
