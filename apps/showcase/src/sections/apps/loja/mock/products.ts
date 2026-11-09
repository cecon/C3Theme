// Produtos montados do catálogo, nota média, desconto e avaliações.
import type { Product, Seed } from './catalog';
import { SEEDS_A } from './seeds-a';
import { SEEDS_B } from './seeds-b';

function descricao(s: Seed) {
  return `${s.nome} da ${s.marca}: ${s.resumo.charAt(0).toLowerCase()}${s.resumo.slice(1)} Pensado para o uso do dia a dia, com acabamento caprichado e materiais selecionados. Enviamos em embalagem reciclável e você pode trocar em até 30 dias.`;
}

export const SEED_PRODUCTS: Product[] = [...SEEDS_A, ...SEEDS_B].map((s, i) => ({
  ...s,
  id: i + 1,
  sku: `C3-${String(1000 + i * 37).padStart(5, '0')}`,
  descricao: descricao(s),
  notas: [20 + ((i * 13) % 60), 8 + ((i * 7) % 30), 2 + ((i * 5) % 12), (i * 3) % 6, (i * 2) % 4],
  criadoEm: new Date(2026, 9 - (i % 8), 1 + ((i * 9) % 27)).toISOString()
}));

export function rating(p: Pick<Product, 'notas'>) {
  const total = p.notas.reduce((a, b) => a + b, 0);
  const avg = total ? p.notas.reduce((acc, n, i) => acc + n * (5 - i), 0) / total : 0;
  return { total, avg: Math.round(avg * 10) / 10 };
}

export const discountPct = (p: Product) => (p.precoAntigo ? Math.round((1 - p.preco / p.precoAntigo) * 100) : 0);

export interface Review {
  id: number;
  autor: string;
  nota: number;
  data: string;
  titulo: string;
  texto: string;
}

const AUTORES = ['Marina C.', 'Paulo R.', 'Débora S.', 'Henrique L.', 'Lívia M.', 'Caio F.', 'Renata A.', 'Sérgio T.'];
const TEXTOS: [number, string, string][] = [
  [5, 'Superou as expectativas', 'Chegou antes do prazo e a qualidade é ótima. Já indiquei para a família.'],
  [4, 'Bom custo-benefício', 'Atende bem ao que promete. Só achei a embalagem simples demais.'],
  [5, 'Recomendo', 'Uso todos os dias há um mês e continua como novo.'],
  [3, 'Razoável', 'Funciona, mas esperava um acabamento um pouco melhor pelo preço.'],
  [5, 'Perfeito', 'Exatamente como nas fotos e na descrição. Compraria de novo.'],
  [4, 'Gostei bastante', 'Produto confortável e bonito. A entrega atrasou um dia.'],
  [2, 'Não era o que eu queria', 'O tamanho é menor do que imaginei. A troca foi rápida, pelo menos.']
];

export function seedReviews(productId: number): Review[] {
  return Array.from({ length: 3 + (productId % 3) }, (_, k) => {
    const [nota, titulo, texto] = TEXTOS[(productId * 3 + k * 2) % TEXTOS.length];
    return {
      id: productId * 100 + k,
      autor: AUTORES[(productId + k * 3) % AUTORES.length],
      nota,
      titulo,
      texto,
      data: new Date(2026, 8 - k, 3 + ((productId * 7 + k * 5) % 25)).toISOString()
    };
  });
}
