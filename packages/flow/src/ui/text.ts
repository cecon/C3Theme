import { useCallback } from 'react';
import { useIntl } from 'react-intl';

// Textos do editor de fluxo. Português é o padrão; inglês vem embutido. O app sobrescreve qualquer chave nas
// mensagens do react-intl (C3ThemeProvider loadMessages).
const PT = {
  'c3.flow.canvas': 'Fluxo de trabalho',
  'c3.flow.zoomIn': 'Aproximar',
  'c3.flow.zoomOut': 'Afastar',
  'c3.flow.fitView': 'Ajustar à tela',
  'c3.flow.minimap': 'Minimapa do fluxo',
  'c3.flow.nodeHelp': 'Tab vai de um passo a outro. Enter seleciona, as setas movem e Delete remove.',
  'c3.flow.nodeHelpReadOnly': 'Tab vai de um passo a outro. Enter mostra os detalhes.',
  'c3.flow.edgeHelp': 'Ligação. Delete remove.',
  'c3.flow.handle': 'Ponto de ligação',
  'c3.flow.toolbar': 'Ações do fluxo',
  'c3.flow.add': 'Adicionar passo',
  'c3.flow.layout': 'Organizar',
  'c3.flow.issues': '{count, plural, =0 {Sem problemas} one {# problema} other {# problemas}}',
  'c3.flow.status.idle': 'Parado',
  'c3.flow.status.running': 'Em andamento',
  'c3.flow.status.waiting': 'Esperando',
  'c3.flow.status.done': 'Concluído',
  'c3.flow.status.failed': 'Falhou',
  'c3.flow.issue.orphan': 'Passo solto: não está ligado a nada',
  'c3.flow.issue.missingInput': 'Nenhum passo leva até aqui',
  'c3.flow.issue.unlinkedOutput': 'Saída "{port}" sem ligação',
  'c3.flow.issue.unlinkedNext': 'Próximo passo sem ligação',
  'c3.flow.issue.cycle': 'Ciclo sem limite de voltas',
  'c3.flow.issue.required': 'Preencha "{field}"',
  'c3.flow.issue.unknownType': 'Tipo de passo desconhecido: {type}',
  'c3.flow.next': 'Próximo passo',
  'c3.flow.nextFrom': 'Próximo passo se "{port}"',
  'c3.flow.noLink': 'Sem ligação',
  'c3.flow.name': 'Nome',
  'c3.flow.inspector': 'Configurar {name}',
  'c3.flow.links': 'Ligações',
  'c3.flow.problems': 'Problemas',
  'c3.flow.remove': 'Remover passo',
  'c3.flow.close': 'Fechar',
  'c3.flow.nodeAria': '{name}, {type}',
  'c3.flow.edgeAria': '{source} para {target}',
  'c3.flow.edgeAriaPort': '{source} para {target}, saída {port}'
};

export type FlowMessageId = keyof typeof PT;

export const FLOW_MESSAGES_EN: Record<FlowMessageId, string> = {
  'c3.flow.canvas': 'Workflow',
  'c3.flow.zoomIn': 'Zoom in',
  'c3.flow.zoomOut': 'Zoom out',
  'c3.flow.fitView': 'Fit view',
  'c3.flow.minimap': 'Workflow minimap',
  'c3.flow.nodeHelp': 'Tab moves between steps. Enter selects, arrows move and Delete removes.',
  'c3.flow.nodeHelpReadOnly': 'Tab moves between steps. Enter shows the details.',
  'c3.flow.edgeHelp': 'Link. Delete removes it.',
  'c3.flow.handle': 'Link point',
  'c3.flow.toolbar': 'Workflow actions',
  'c3.flow.add': 'Add step',
  'c3.flow.layout': 'Arrange',
  'c3.flow.issues': '{count, plural, =0 {No issues} one {# issue} other {# issues}}',
  'c3.flow.status.idle': 'Idle',
  'c3.flow.status.running': 'Running',
  'c3.flow.status.waiting': 'Waiting',
  'c3.flow.status.done': 'Done',
  'c3.flow.status.failed': 'Failed',
  'c3.flow.issue.orphan': 'Loose step: not linked to anything',
  'c3.flow.issue.missingInput': 'No step leads here',
  'c3.flow.issue.unlinkedOutput': 'Output "{port}" is not linked',
  'c3.flow.issue.unlinkedNext': 'Next step is not linked',
  'c3.flow.issue.cycle': 'Loop without a limit',
  'c3.flow.issue.required': 'Fill in "{field}"',
  'c3.flow.issue.unknownType': 'Unknown step type: {type}',
  'c3.flow.next': 'Next step',
  'c3.flow.nextFrom': 'Next step if "{port}"',
  'c3.flow.noLink': 'Not linked',
  'c3.flow.name': 'Name',
  'c3.flow.inspector': 'Configure {name}',
  'c3.flow.links': 'Links',
  'c3.flow.problems': 'Issues',
  'c3.flow.remove': 'Remove step',
  'c3.flow.close': 'Close',
  'c3.flow.nodeAria': '{name}, {type}',
  'c3.flow.edgeAria': '{source} to {target}',
  'c3.flow.edgeAriaPort': '{source} to {target}, output {port}'
};

export type FlowText = (id: FlowMessageId, values?: Record<string, string | number>) => string;

/** `t('c3.flow.add')` no idioma atual: mensagem do app, senão a embutida (inglês ou português). */
export function useFlowText(): FlowText {
  const intl = useIntl();
  const en = intl.locale.toLowerCase().startsWith('en');
  return useCallback(
    (id: FlowMessageId, values?: Record<string, string | number>) =>
      intl.formatMessage({ id, defaultMessage: en ? FLOW_MESSAGES_EN[id] : PT[id] }, values),
    [intl, en]
  );
}
