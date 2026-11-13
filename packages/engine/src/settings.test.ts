import { describe, expect, it } from 'vitest';

import {
  findPage,
  initialSection,
  pageTrail,
  settingsEntries,
  settingsPermissions,
  visibleRows,
  visibleSections,
  type SettingsContext
} from './settings';
import type { SettingsDef, SettingsRowDef, SettingsSectionDef } from './settingsTypes';

const text = (value: { id?: string } | string | undefined, fallback = '') =>
  typeof value === 'string' ? value : ((value as { id?: string } | undefined)?.id ?? fallback);

const linha = (id: string, title: string, extra: Partial<SettingsRowDef> = {}): SettingsRowDef => ({
  id,
  title,
  description: `${title}, descrição`,
  control: { type: 'switch', value: false },
  ...extra
});

const PESSOAL: SettingsDef = {
  title: 'Configurações',
  search: 'Pesquisar configurações…',
  sections: [
    { id: 'geral', title: 'Geral', rows: [linha('iniciar', 'Abrir ao iniciar')] },
    { id: 'agentes', title: 'Agentes', rows: [linha('padrao', 'Agente padrão')] },
    { id: 'perfil', title: 'Perfil', rows: [linha('nome', 'Nome')] },
    {
      id: 'notificacoes',
      title: 'Notificações',
      rows: [linha('som', 'Som das notificações', { description: 'Toca um som quando chega uma mensagem.' })]
    },
    { id: 'voz', title: 'Voz', rows: [linha('idioma', 'Idioma da transcrição', { keywords: ['microfone'] })] },
    { id: 'ilha', title: 'Ilha dinâmica', rows: [linha('mostrar', 'Mostrar a ilha')] },
    { id: 'doca', title: 'Dock de agentes', rows: [linha('doca', 'Mostrar o dock')] },
    { id: 'computador', title: 'Uso do computador', platforms: ['desktop', 'web'], rows: [linha('acesso', 'Acesso à tela')] },
    { id: 'cobranca', title: 'Cobrança', rows: [linha('plano', 'Plano atual')] },
    { id: 'celular', title: 'Conectar celular', rows: [linha('parear', 'Parear celular')] },
    { id: 'atualizacoes', title: 'Atualizações', rows: [linha('canal', 'Canal')] },
    {
      id: 'servidores',
      title: 'Servidores hospedados',
      rows: [linha('servidores', 'Servidores')],
      pages: [
        {
          id: 'provedor',
          title: 'Provedor',
          rows: [linha('chave', 'Chave do provedor')],
          pages: [{ id: 'modelos', title: 'Modelos', rows: [linha('modelo', 'Modelo padrão')] }]
        }
      ]
    }
  ]
};

const CONTEXTO: SettingsContext = { platform: 'desktop', pageAccess: {} };

describe('configurações em modal', () => {
  it('mantém as 12 abas na ordem e filtra por plataforma sem deixar buraco', () => {
    const nomes = visibleSections(PESSOAL, CONTEXTO).map((section) => section.id);
    expect(nomes).toEqual([
      'geral',
      'agentes',
      'perfil',
      'notificacoes',
      'voz',
      'ilha',
      'doca',
      'computador',
      'cobranca',
      'celular',
      'atualizacoes',
      'servidores'
    ]);
    expect(visibleSections(PESSOAL, { platform: 'mobile', pageAccess: {} }).map((section) => section.id)).not.toContain('computador');
  });

  it('a permissão do pages esconde a seção', () => {
    const def: SettingsDef = { ...PESSOAL, sections: [{ ...PESSOAL.sections[1]!, permission: '/configuracoes/agentes' }] };
    expect(visibleSections(def, { platform: 'desktop', pageAccess: { '/configuracoes/agentes': false } })).toEqual([]);
    expect(
      settingsPermissions({ ...PESSOAL, server: { ...PESSOAL, sections: [{ ...PESSOAL.sections[2]!, permission: '/servidor/perfil' }] } })
    ).toEqual(['/servidor/perfil']);
  });

  it('a linha condicional some pela plataforma', () => {
    const rows = [linha('a', 'A'), linha('b', 'B', { platforms: ['mobile'] })];
    expect(visibleRows(rows, 'desktop').map((row) => row.id)).toEqual(['a']);
    expect(visibleRows(rows, 'mobile').map((row) => row.id)).toEqual(['a', 'b']);
  });

  it('a seção inicial cai para a primeira visível', () => {
    expect(initialSection(PESSOAL, CONTEXTO)).toBe('geral');
    expect(initialSection({ ...PESSOAL, initialSection: 'voz' }, CONTEXTO)).toBe('voz');
    expect(initialSection({ ...PESSOAL, initialSection: 'inexistente' }, CONTEXTO)).toBe('geral');
    expect(initialSection(PESSOAL, { platform: 'mobile', pageAccess: {} }, 'computador')).toBe('geral');
    expect(initialSection(PESSOAL, CONTEXTO, 'voz')).toBe('voz');
    expect(initialSection({ ...PESSOAL, initialSection: 'geral' }, CONTEXTO, 'voz')).toBe('voz');
  });

  it('a busca conhece as linhas de todas as abas e das subpáginas, com onde moram', () => {
    const entries = settingsEntries(PESSOAL, CONTEXTO, text);
    expect(entries).toHaveLength(14);
    expect(entries.find((entry) => entry.id === 'nome')).toMatchObject({ section: 'perfil', where: 'Perfil' });
    expect(entries.find((entry) => entry.id === 'chave')).toMatchObject({
      section: 'servidores',
      page: 'provedor',
      where: 'Servidores hospedados · Provedor'
    });
    expect(entries.find((entry) => entry.id === 'modelo')).toMatchObject({
      page: 'provedor/modelos',
      where: 'Servidores hospedados · Provedor · Modelos'
    });
  });

  it('acha a subpágina e monta a trilha até ela', () => {
    const secao = PESSOAL.sections[PESSOAL.sections.length - 1]!;
    expect(findPage(secao, ['provedor'])?.title).toBe('Provedor');
    expect(findPage(secao, ['provedor', 'modelos'])?.title).toBe('Modelos');
    expect(findPage(secao, ['nao-existe'])).toBeUndefined();
    expect(pageTrail(secao, ['provedor', 'modelos']).map((page) => page.id)).toEqual(['provedor', 'modelos']);
    expect(pageTrail(secao, ['provedor', 'nao-existe']).map((page) => page.id)).toEqual(['provedor']);
  });

  it('as seções do servidor seguem a mesma regra de ordem e capacidade', () => {
    const servidor: SettingsDef = {
      title: 'Configurações do servidor',
      sections: [
        { id: 'geral', title: 'Geral', rows: [linha('nome', 'Nome do servidor')] },
        { id: 'mcp', title: 'MCP', permission: '/servidor/mcp', rows: [linha('servidores', 'Servidores MCP')] },
        { id: 'area', title: 'Área de trabalho', platforms: ['desktop'], rows: [linha('acesso', 'Quem pode acessar')] },
        { id: 'perfis', title: 'Perfis do navegador', platforms: ['desktop'], rows: [linha('perfis', 'Perfis')] }
      ]
    };
    const contexto: SettingsContext = { platform: 'desktop', pageAccess: { '/servidor/mcp': false } };
    expect(visibleSections(servidor, contexto).map((section) => section.id)).toEqual(['geral', 'area', 'perfis']);
    expect(settingsEntries(servidor, contexto, text).map((entry) => entry.id)).toEqual(['nome', 'acesso', 'perfis']);
  });
});

it('capacidade filtra seções; busca não revela conteúdo de seção negada visível', () => {
  const def: SettingsDef = {
    title: 'Servidor',
    sections: [
      { id: 'local', title: 'Área remota', capability: 'remote', rows: [linha('acesso', 'Acesso remoto')] },
      { id: 'segredo', title: 'Cofre', permission: '/cofre', hideWhenDenied: false, rows: [linha('senha', 'Senha privada')] }
    ]
  };
  const ctx = { ...CONTEXTO, pageAccess: { '/cofre': false } };
  expect(visibleSections(def, ctx).map((s) => s.id)).toEqual(['segredo']);
  expect(settingsEntries(def, ctx, text)).toEqual([]);
  expect(visibleSections(def, { ...ctx, capabilities: ['remote'] }).map((s) => s.id)).toEqual(['local', 'segredo']);
  expect(settingsEntries(def, { ...ctx, capabilities: ['remote'] }, text, true)).toMatchObject([
    { title: 'Área remota', section: 'local' }
  ]);
});

// Referência de tipo para os fixtures: a seção é o que a navegação da UI recebe.
const _secao: SettingsSectionDef = PESSOAL.sections[0]!;
void _secao;
