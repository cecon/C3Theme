// Catálogo de exemplo, primeira metade.
import type { Seed } from './catalog';

/** Primeira metade do catálogo (a ordem das duas listas define o id). */
export const SEEDS_A: Seed[] = [
  {
    nome: 'Fone sem fio Aurora',
    categoria: 'eletronicos',
    marca: 'Sonora',
    preco: 349.9,
    precoAntigo: 429.9,
    estoque: 34,
    cores: ['preto', 'branco', 'azul'],
    forma: 'fone',
    resumo: 'Cancelamento de ruído e bateria para o dia inteiro.',
    destaques: ['Até 30 horas de bateria', 'Cancelamento ativo de ruído', 'Conexão com dois aparelhos'],
    especificacoes: [
      ['Conexão', 'Bluetooth 5.3'],
      ['Bateria', '30 h'],
      ['Peso', '240 g'],
      ['Garantia', '12 meses']
    ]
  },
  {
    nome: 'Relógio inteligente Pulso',
    categoria: 'eletronicos',
    marca: 'Ritmo',
    preco: 899,
    estoque: 12,
    cores: ['preto', 'rosa', 'verde'],
    forma: 'relogio',
    resumo: 'Monitor cardíaco, GPS e mais de 100 modos de treino.',
    destaques: ['GPS integrado', 'Resistente à água (5 ATM)', 'Tela sempre ligada'],
    especificacoes: [
      ['Tela', '1,4" AMOLED'],
      ['Bateria', 'Até 10 dias'],
      ['Sensores', 'Frequência cardíaca, SpO2'],
      ['Garantia', '12 meses']
    ]
  },
  {
    nome: 'Tênis de corrida Vento',
    categoria: 'esportes',
    marca: 'Passada',
    preco: 459.9,
    precoAntigo: 549.9,
    estoque: 48,
    cores: ['azul', 'preto', 'vermelho'],
    tamanhos: ['37', '38', '39', '40', '41', '42', '43'],
    forma: 'tenis',
    resumo: 'Amortecimento responsivo para treinos longos.',
    destaques: ['Entressola com espuma leve', 'Cabedal respirável', 'Solado de borracha antiderrapante'],
    especificacoes: [
      ['Peso', '260 g (tam. 40)'],
      ['Drop', '8 mm'],
      ['Indicado para', 'Asfalto e esteira'],
      ['Origem', 'Nacional']
    ]
  },
  {
    nome: 'Camiseta básica algodão',
    categoria: 'moda',
    marca: 'Fio Bom',
    preco: 69.9,
    estoque: 150,
    cores: ['branco', 'preto', 'cinza', 'verde'],
    tamanhos: ['P', 'M', 'G', 'GG'],
    forma: 'camiseta',
    resumo: 'Algodão penteado macio, modelagem reta.',
    destaques: ['100% algodão penteado', 'Não desbota na lavagem', 'Costura reforçada'],
    especificacoes: [
      ['Tecido', 'Malha 30.1'],
      ['Composição', '100% algodão'],
      ['Lavagem', 'Máquina, água fria'],
      ['Origem', 'Nacional']
    ]
  },
  {
    nome: 'Mochila urbana Trilha',
    categoria: 'acessorios',
    marca: 'Rumo',
    preco: 279,
    estoque: 22,
    cores: ['cinza', 'preto', 'terracota'],
    forma: 'mochila',
    resumo: 'Compartimento acolchoado para notebook de até 15".',
    destaques: ['Tecido impermeável', 'Bolso antifurto nas costas', 'Alças com espuma'],
    especificacoes: [
      ['Capacidade', '22 L'],
      ['Notebook', 'Até 15,6"'],
      ['Material', 'Poliéster reciclado'],
      ['Garantia', '6 meses']
    ]
  },
  {
    nome: 'Caneca térmica Café',
    categoria: 'casa',
    marca: 'Lar Doce',
    preco: 89.9,
    precoAntigo: 109.9,
    estoque: 0,
    cores: ['vermelho', 'branco', 'amarelo'],
    forma: 'caneca',
    resumo: 'Mantém a bebida quente por até 6 horas.',
    destaques: ['Parede dupla de inox', 'Tampa antivazamento', 'Livre de BPA'],
    especificacoes: [
      ['Capacidade', '450 ml'],
      ['Material', 'Aço inox'],
      ['Térmico', '6 h quente / 12 h frio'],
      ['Lava-louças', 'Somente o corpo']
    ]
  },
  {
    nome: 'Luminária de mesa Foco',
    categoria: 'casa',
    marca: 'Lume',
    preco: 189.9,
    estoque: 17,
    cores: ['amarelo', 'preto', 'branco'],
    forma: 'luminaria',
    resumo: 'Braço articulado e três temperaturas de luz.',
    destaques: ['LED de baixo consumo', 'Ajuste de intensidade', 'Porta USB na base'],
    especificacoes: [
      ['Potência', '8 W'],
      ['Temperatura', '3000 K a 6000 K'],
      ['Altura', '45 cm'],
      ['Voltagem', 'Bivolt']
    ]
  },
  {
    nome: 'Óculos de sol Praia',
    categoria: 'acessorios',
    marca: 'Mirante',
    preco: 219,
    estoque: 40,
    cores: ['preto', 'terracota', 'azul'],
    forma: 'oculos',
    resumo: 'Lentes polarizadas com proteção UV400.',
    destaques: ['Proteção UV400', 'Lentes polarizadas', 'Acompanha estojo'],
    especificacoes: [
      ['Lente', 'Policarbonato polarizado'],
      ['Armação', 'Acetato'],
      ['Largura', '140 mm'],
      ['Garantia', '6 meses']
    ]
  }
];
