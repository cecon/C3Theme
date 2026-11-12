// O resumo de uso que o sistema calcularia (#108): tokens por provedor, consumo por agente e o card de atualização,
// com o download andando a cada leitura. O painel `/uso` lê isto pelo `dashboard.source`, sem entidade.

type Estado = 'disponivel' | 'baixando' | 'pronto' | 'atualizado';

let estado: Estado = 'disponivel';
let progresso = 0;

const ACOES: Record<Estado, Record<string, { disabled?: boolean; instruction?: string }>> = {
  disponivel: { verificar: {}, baixar: {} },
  baixando: { instalar: { disabled: true, instruction: 'Espere o download terminar para instalar.' } },
  pronto: { instalar: {} },
  atualizado: { verificar: {} }
};

function atualizacao() {
  if (estado === 'baixando') {
    progresso = Math.min(100, progresso + 20);
    if (progresso === 100) estado = 'pronto';
  }
  return {
    estado,
    atual: estado === 'atualizado' ? '2.4.0' : '2.3.1',
    disponivel: estado === 'atualizado' ? undefined : '2.4.0',
    canal: 'beta',
    progresso: estado === 'baixando' ? progresso : undefined,
    actions: ACOES[estado]
  };
}

const uso = () => ({
  provedores: [
    {
      nome: 'Anthropic',
      tokens: { entrada: 612_000, saida: 248_000, total: 860_000, limite: 1_000_000 },
      janela: { inicio: '2026-11-01T00:00:00Z', fim: '2026-11-30T23:59:59Z' },
      custo: { valor: 41.3, moeda: 'USD' }
    },
    {
      nome: 'OpenAI',
      tokens: { entrada: 98_000, saida: 31_000, total: 129_000, limite: 500_000 },
      janela: { inicio: '2026-11-01T00:00:00Z', fim: '2026-11-30T23:59:59Z' },
      custo: { valor: 52.9, moeda: 'BRL' }
    }
  ],
  agentes: [
    { nome: 'Revisor de PR', tokens: 420_000, participacao: 42.4 },
    { nome: 'Atendimento', tokens: 310_000, participacao: 31.3 },
    { nome: 'Relatórios', tokens: 259_000, participacao: 26.2 }
  ],
  atualizacao: atualizacao()
});

const mudar = (proximo: Estado) => () => {
  estado = proximo;
  progresso = 0;
  return uso();
};

export const USO_SUMMARIES = { '/uso': uso };
export const USO_ACTIONS = {
  '/atualizacao/verificar': mudar('disponivel'),
  '/atualizacao/baixar': mudar('baixando'),
  '/atualizacao/instalar': mudar('atualizado')
};
