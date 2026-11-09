import { Messages2, Profile2User, DocumentText } from 'iconsax-reactjs';

import type { CatalogItem } from '@c3theme/ui';

const DESCRICAO = `Responde clientes da clínica pelo WhatsApp, **marca consultas** na agenda e avisa quando falta documento.

## O que ele faz

- Confere o convênio antes de marcar
- Lembra a consulta um dia antes
- Passa para uma pessoa quando não sabe responder

Funciona com a habilidade \`agenda\` e com o app WhatsApp.`;

/** Loja mista: um item por estado, dos três tipos, com e sem categoria. */
export const ITENS: CatalogItem[] = [
  {
    id: 'atendente-clinica',
    kind: 'agent',
    name: 'Atendente da clínica',
    summary: 'Responde pacientes, marca consultas e lembra na véspera.',
    author: 'Piecework',
    version: '1.4.0',
    category: 'Atendimento',
    icon: <Profile2User size={22} />,
    status: { state: 'update-available', version: '1.5.0' },
    description: DESCRICAO,
    permissions: ['Ler e escrever na agenda', 'Enviar mensagens pelo WhatsApp'],
    files: ['agents/atendente-clinica/AGENT.md', 'agents/atendente-clinica/respostas.md'],
    editedFiles: ['agents/atendente-clinica/respostas.md'],
    versions: [
      { version: '1.5.0', date: '02/11/2026', notes: 'Confere o convênio antes de marcar.' },
      { version: '1.4.0', date: '10/10/2026', notes: 'Lembrete na véspera.' },
      { version: '1.0.0', date: '01/09/2026' }
    ]
  },
  {
    id: 'vendedor',
    kind: 'agent',
    name: 'Vendedor de balcão',
    summary: 'Tira dúvida de preço e estoque e monta o orçamento para o cliente aprovar.',
    author: 'Piecework',
    version: '0.9.2',
    category: 'Vendas',
    status: { state: 'available' }
  },
  {
    id: 'ler-pdf',
    kind: 'skill',
    name: 'Ler contratos em PDF',
    summary: 'Extrai partes, prazos e valores de contratos e devolve um resumo.',
    author: 'Comunidade',
    version: '2.1.0',
    category: 'Documentos',
    icon: <DocumentText size={22} />,
    status: { state: 'installing', progress: 45 }
  },
  {
    id: 'planilhas',
    kind: 'skill',
    name: 'Planilhas',
    summary: 'Lê e escreve planilhas do Excel e do Google, com fórmulas.',
    author: 'Piecework',
    version: '1.0.0',
    category: 'Documentos',
    status: { state: 'installed' }
  },
  {
    id: 'whatsapp',
    kind: 'app',
    name: 'WhatsApp',
    summary: 'Conecta um número do WhatsApp Business para os agentes conversarem.',
    author: 'Piecework',
    version: '3.0.1',
    category: 'Atendimento',
    icon: <Messages2 size={22} />,
    status: { state: 'error', message: 'Sem conexão com a internet.' }
  },
  {
    id: 'agenda-antiga',
    kind: 'skill',
    name: 'Agenda (versão antiga)',
    summary: 'Substituída pela habilidade Agenda; continua funcionando aqui.',
    author: 'Comunidade',
    version: '0.3.0',
    status: { state: 'removed-from-catalog' }
  }
];
