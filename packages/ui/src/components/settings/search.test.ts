import { describe, expect, it } from 'vitest';

import { foldSettingsText, rankSettings, type SettingsSearchEntry } from './search';

const entries: SettingsSearchEntry[] = [
  {
    id: 'notificacoes',
    title: 'Notificações',
    section: 'notificacoes',
    where: 'Notificações',
    description: 'Avisos de tarefas e mensagens.'
  },
  {
    id: 'notificacoes-som',
    title: 'Som das notificações',
    section: 'notificacoes',
    where: 'Notificações',
    description: 'Toca um som quando chega uma mensagem.'
  },
  { id: 'perfil-nome', title: 'Nome', section: 'perfil', where: 'Perfil', description: 'O nome que aparece para as pessoas.' },
  {
    id: 'voz',
    title: 'Voz',
    section: 'voz',
    where: 'Voz',
    description: 'Modelo de voz e idioma da transcrição.',
    keywords: ['microfone', 'audio']
  },
  {
    id: 'provedor',
    title: 'Provedor',
    section: 'servidor',
    page: 'provedores',
    where: 'Provedores · OpenAI',
    description: 'Chave e modelos do provedor.'
  }
];

describe('busca das configurações', () => {
  it('sem acento e sem maiúscula', () => {
    expect(foldSettingsText('Notificações')).toBe('notificacoes');
  });

  it('busca vazia não acha nada', () => {
    expect(rankSettings(entries, '   ')).toEqual([]);
  });

  it('põe o título exato na frente e o restante por título, palavra-chave e descrição', () => {
    const hits = rankSettings(entries, 'notificacoes');
    expect(hits.map((hit) => hit.id)).toEqual(['notificacoes', 'notificacoes-som']);
    expect(hits[0]?.score).toBe(0);
    expect(hits[1]?.score).toBe(2);
    expect(rankSettings(entries, 'microfone').map((hit) => hit.id)).toEqual(['voz']);
    expect(rankSettings(entries, 'mensagem').map((hit) => hit.id)).toEqual(['notificacoes-som']);
  });

  it('acha pela descrição e mostra onde a linha mora', () => {
    const [hit] = rankSettings(entries, 'idioma da transcricao');
    expect(hit).toMatchObject({ id: 'voz', where: 'Voz', score: 4 });
  });

  it('todas as palavras digitadas precisam casar e o resultado é limitado', () => {
    expect(rankSettings(entries, 'notificacoes som')).toHaveLength(1);
    expect(rankSettings(entries, 'notificacoes inexistente')).toEqual([]);
    expect(rankSettings(entries, 'a', 2)).toHaveLength(2);
  });

  it('empate mantém a ordem entregue', () => {
    expect(rankSettings(entries, 'mensagem').map((hit) => hit.section)).toEqual(['notificacoes']);
  });
});
