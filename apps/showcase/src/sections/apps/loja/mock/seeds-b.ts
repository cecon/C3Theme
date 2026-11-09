// Catálogo de exemplo, segunda metade.
import type { Seed } from './catalog';

/** Segunda metade do catálogo (a ordem das duas listas define o id). */
export const SEEDS_B: Seed[] = [
  {
    nome: 'Garrafa esportiva 1 litro',
    categoria: 'esportes',
    marca: 'Passada',
    preco: 59.9,
    estoque: 85,
    cores: ['verde', 'azul', 'rosa', 'preto'],
    forma: 'garrafa',
    resumo: 'Tampa com bico e marcação de hidratação.',
    destaques: ['Livre de BPA', 'Marcação de horários', 'Alça para transporte'],
    especificacoes: [
      ['Capacidade', '1 L'],
      ['Material', 'Tritan'],
      ['Lava-louças', 'Sim'],
      ['Origem', 'Nacional']
    ]
  },
  {
    nome: 'Teclado mecânico Toque',
    categoria: 'eletronicos',
    marca: 'Tecla',
    preco: 529,
    precoAntigo: 649,
    estoque: 9,
    cores: ['preto', 'branco'],
    forma: 'teclado',
    resumo: 'Switches silenciosos e layout ABNT2.',
    destaques: ['Layout ABNT2 com Ç', 'Iluminação ajustável', 'Cabo USB-C removível'],
    especificacoes: [
      ['Switch', 'Linear silencioso'],
      ['Layout', 'ABNT2, 75%'],
      ['Conexão', 'USB-C e Bluetooth'],
      ['Garantia', '24 meses']
    ]
  },
  {
    nome: 'Bola de futebol Campo',
    categoria: 'esportes',
    marca: 'Gol',
    preco: 129.9,
    estoque: 60,
    cores: ['branco', 'amarelo'],
    forma: 'bola',
    resumo: 'Costurada à mão, tamanho oficial.',
    destaques: ['Tamanho e peso oficiais', 'Câmara de butil', 'Costura manual'],
    especificacoes: [
      ['Tamanho', '5'],
      ['Peso', '430 g'],
      ['Superfície', 'Grama natural'],
      ['Origem', 'Nacional']
    ]
  },
  {
    nome: 'Vaso de cerâmica Jardim',
    categoria: 'casa',
    marca: 'Lar Doce',
    preco: 74.9,
    estoque: 28,
    cores: ['terracota', 'branco', 'verde'],
    forma: 'vaso',
    resumo: 'Feito à mão, com furo de drenagem.',
    destaques: ['Produção artesanal', 'Esmalte resistente', 'Prato incluso'],
    especificacoes: [
      ['Altura', '18 cm'],
      ['Diâmetro', '16 cm'],
      ['Material', 'Cerâmica'],
      ['Uso', 'Interno e externo']
    ]
  },
  {
    nome: 'Boné aba curva',
    categoria: 'moda',
    marca: 'Fio Bom',
    preco: 79.9,
    estoque: 3,
    cores: ['preto', 'azul', 'vermelho'],
    tamanhos: ['Único'],
    forma: 'bone',
    resumo: 'Ajuste traseiro e tecido respirável.',
    destaques: ['Regulagem com fivela', 'Tecido com proteção UV', 'Aba pré-curvada'],
    especificacoes: [
      ['Composição', 'Algodão e poliéster'],
      ['Ajuste', 'Fivela metálica'],
      ['Tamanho', 'Único (54 a 60 cm)'],
      ['Origem', 'Nacional']
    ]
  },
  {
    nome: 'Caixa de som portátil Eco',
    categoria: 'eletronicos',
    marca: 'Sonora',
    preco: 399,
    estoque: 25,
    cores: ['azul', 'preto', 'verde'],
    forma: 'caixaSom',
    resumo: 'Som potente, à prova d’água, para levar a qualquer lugar.',
    destaques: ['Resistente à água (IP67)', 'Até 16 horas de música', 'Pareamento em estéreo'],
    especificacoes: [
      ['Potência', '20 W RMS'],
      ['Bateria', '16 h'],
      ['Conexão', 'Bluetooth 5.1'],
      ['Garantia', '12 meses']
    ]
  },
  {
    nome: 'Jaqueta corta-vento',
    categoria: 'moda',
    marca: 'Rumo',
    preco: 319.9,
    precoAntigo: 389.9,
    estoque: 14,
    cores: ['amarelo', 'azul', 'preto'],
    tamanhos: ['P', 'M', 'G', 'GG'],
    forma: 'camiseta',
    resumo: 'Leve, dobrável e repelente à água.',
    destaques: ['Repelente à água', 'Cabe no próprio bolso', 'Capuz ajustável'],
    especificacoes: [
      ['Tecido', 'Nylon ripstop'],
      ['Peso', '180 g'],
      ['Bolsos', '2 com zíper'],
      ['Origem', 'Importado']
    ]
  },
  {
    nome: 'Tapete de yoga Equilíbrio',
    categoria: 'esportes',
    marca: 'Zen',
    preco: 149.9,
    estoque: 31,
    cores: ['rosa', 'verde', 'cinza'],
    forma: 'tapete',
    resumo: 'Antiderrapante dos dois lados, 6 mm de espessura.',
    destaques: ['Material atóxico', 'Alça de transporte', 'Fácil de limpar'],
    especificacoes: [
      ['Medidas', '183 × 61 cm'],
      ['Espessura', '6 mm'],
      ['Material', 'TPE'],
      ['Peso', '900 g']
    ]
  }
];
