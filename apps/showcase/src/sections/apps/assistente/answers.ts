import type { AgentQuestion, ToolCall } from '@c3theme/chat';

// Respostas roteirizadas do assistente da vitrine: o que um modelo de verdade devolveria, em markdown.

export interface ScriptedAnswer {
  /** Palavras que escolhem esta resposta. */
  match: RegExp;
  /** Raciocínio antes das ferramentas e (opcional) depois delas. */
  reasoning: [string, string?];
  tools: Pick<ToolCall, 'name' | 'label' | 'input' | 'output'>[];
  text: string;
  /** Termina perguntando ao usuário (card com opções). */
  question?: AgentQuestion;
}

export const ANSWERS: ScriptedAnswer[] = [
  {
    match: /\bsql\b|código|code/i,
    reasoning: [
      'O usuário quer um SQL que conte produtos por grupo. Preciso saber o nome das tabelas e como o produto aponta para o grupo antes de escrever a consulta.',
      'A tabela produto tem grupo_id e ativo. Vou juntar com grupo, filtrar os ativos e ordenar pelos grupos com mais produtos.'
    ],
    tools: [
      {
        name: 'erp_schema',
        label: 'Estrutura do banco',
        input: '{\n  "tabelas": ["produto", "grupo"]\n}',
        output: 'produto(id, nome, grupo_id → grupo.id, ativo boolean)\ngrupo(id, nome, pai_id)'
      }
    ],
    text: [
      'Dá para tirar isso direto do banco com:',
      '',
      '```sql',
      'select g.nome as grupo, count(*) as produtos',
      '  from produto p',
      '  join grupo g on g.id = p.grupo_id',
      ' where p.ativo',
      ' group by g.nome',
      ' order by produtos desc;',
      '```',
      '',
      'A tabela `produto` guarda o grupo em `grupo_id`. Detalhes em [documentação do schema](https://example.com/schema).'
    ].join('\n')
  },
  {
    match: /produto|cadastr|estoque/i,
    reasoning: [
      'Pergunta sobre a quantidade de produtos cadastrados. Primeiro vejo qual rota do sistema lista produtos, depois consulto o cadastro com o filtro de loja.',
      'Vieram 3 produtos e um deles está inativo. Vale responder com a tabela e avisar do inativo, porque “cadastrados” pode incluir ele ou não.'
    ],
    tools: [
      {
        name: 'erp_rotas',
        label: 'Rotas do sistema',
        input: '{\n  "busca": "produtos"\n}',
        output: '[\n  { "rota": "/cadastros/produtos", "entidade": "produto" }\n]'
      },
      {
        name: 'erp_consultar',
        label: 'Consultar cadastro',
        input: '{\n  "entidade": "produto",\n  "filtro": { "loja": 1 },\n  "campos": ["codigo", "nome", "grupo", "estoque", "ativo"]\n}',
        output:
          '3 registros\n100  Coca-Cola 2 L         ativo    48\n101  Água mineral 500 ml   ativo   120\n102  Guaraná 1 L           inativo   0'
      }
    ],
    text: [
      'Hoje a loja tem **3 produtos cadastrados**, 2 ativos:',
      '',
      '| Código | Produto | Grupo | Estoque |',
      '|:--|:--|:--|--:|',
      '| 100 | Coca-Cola 2 L | Bebidas › Refrigerantes | 48 |',
      '| 101 | Água mineral 500 ml | Bebidas › Águas | 120 |',
      '| 102 | ~~Guaraná 1 L~~ | Bebidas › Refrigerantes | 0 |',
      '',
      'O *Guaraná 1 L* está **inativo** desde 12/10. Quer que eu abra o cadastro dele?'
    ].join('\n')
  },
  {
    match: /venda|fatur|vendemos/i,
    reasoning: ['Vendas de outubro: busco o relatório do mês fechado e comparo com setembro para dar contexto.'],
    tools: [
      {
        name: 'erp_relatorio',
        label: 'Relatório de vendas',
        input: '{\n  "periodo": "2026-10",\n  "comparar": "2026-09",\n  "situacao": "faturada"\n}',
        output: 'total: 48320.00 (set: 43142.86)\nticket_medio: 86.40\nmelhor_dia: 2026-10-24\ntop: [100: 412 un, 101: 380 un, 205: 296 kg]'
      }
    ],
    text: [
      '## Vendas de outubro',
      '',
      '- **Total:** R$ 48.320,00 (12% acima de setembro)',
      '- **Ticket médio:** R$ 86,40',
      '- **Melhor dia:** sexta, 24/10',
      '',
      'Os três produtos que mais saíram:',
      '',
      '1. Coca-Cola 2 L, 412 unidades',
      '2. Água mineral 500 ml, 380 unidades',
      '3. Pão francês (kg), 296 kg',
      '',
      '> Os números contam só as vendas **faturadas**; pedidos em aberto ficam de fora.'
    ].join('\n')
  }
];

export const FALLBACK: ScriptedAnswer = {
  match: /.*/,
  reasoning: ['Não reconheci um pedido específico. Melhor explicar o que consigo consultar e dar um exemplo.'],
  tools: [],
  text: 'Posso consultar **cadastros**, **vendas** e o **banco** do sistema. Tente, por exemplo, “quantos produtos temos cadastrados?”.'
};

export const SUGGESTIONS = [
  'Quantos produtos temos cadastrados?',
  'Como foram as vendas de outubro?',
  'Me dá um SQL de produtos por grupo',
  'Remover o produto inativo',
  'Montar o relatório de fechamento'
];
