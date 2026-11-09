// Dados fictícios e fixos usados nos exemplos de componentes.

import type { Tone } from '@c3theme/ui';

export interface Person {
  id: number;
  name: string;
  role: string;
  city: string;
  email: string;
  tone: Tone;
  online?: boolean;
}

export const PEOPLE: Person[] = [
  {
    id: 1,
    name: 'Ana Beatriz Souza',
    role: 'Gerente de projetos',
    city: 'Curitiba',
    email: 'ana.souza@exemplo.com.br',
    tone: 'primary',
    online: true
  },
  { id: 2, name: 'Carlos Henrique Lima', role: 'Desenvolvedor', city: 'Recife', email: 'carlos.lima@exemplo.com.br', tone: 'success' },
  {
    id: 3,
    name: 'Fernanda Rocha',
    role: 'Designer',
    city: 'Porto Alegre',
    email: 'fernanda.rocha@exemplo.com.br',
    tone: 'warning',
    online: true
  },
  {
    id: 4,
    name: 'João Pedro Alves',
    role: 'Analista financeiro',
    city: 'Belo Horizonte',
    email: 'joao.alves@exemplo.com.br',
    tone: 'info'
  },
  { id: 5, name: 'Mariana Costa', role: 'Suporte', city: 'Salvador', email: 'mariana.costa@exemplo.com.br', tone: 'danger' },
  {
    id: 6,
    name: 'Rafael Martins',
    role: 'Vendas',
    city: 'Fortaleza',
    email: 'rafael.martins@exemplo.com.br',
    tone: 'secondary',
    online: true
  },
  { id: 7, name: 'Luciana Ferreira', role: 'RH', city: 'Goiânia', email: 'luciana.ferreira@exemplo.com.br', tone: 'primary' },
  { id: 8, name: 'Thiago Nascimento', role: 'Logística', city: 'Manaus', email: 'thiago.nascimento@exemplo.com.br', tone: 'success' }
];

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

export interface City {
  name: string;
  uf: string;
  region: 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul';
  population: number;
}

export const CITIES: City[] = [
  { name: 'São Paulo', uf: 'SP', region: 'Sudeste', population: 11451245 },
  { name: 'Rio de Janeiro', uf: 'RJ', region: 'Sudeste', population: 6211423 },
  { name: 'Belo Horizonte', uf: 'MG', region: 'Sudeste', population: 2315560 },
  { name: 'Vitória', uf: 'ES', region: 'Sudeste', population: 322869 },
  { name: 'Brasília', uf: 'DF', region: 'Centro-Oeste', population: 2817381 },
  { name: 'Goiânia', uf: 'GO', region: 'Centro-Oeste', population: 1437237 },
  { name: 'Campo Grande', uf: 'MS', region: 'Centro-Oeste', population: 897938 },
  { name: 'Cuiabá', uf: 'MT', region: 'Centro-Oeste', population: 650877 },
  { name: 'Salvador', uf: 'BA', region: 'Nordeste', population: 2417678 },
  { name: 'Fortaleza', uf: 'CE', region: 'Nordeste', population: 2428708 },
  { name: 'Recife', uf: 'PE', region: 'Nordeste', population: 1488920 },
  { name: 'São Luís', uf: 'MA', region: 'Nordeste', population: 1037775 },
  { name: 'Natal', uf: 'RN', region: 'Nordeste', population: 751300 },
  { name: 'Manaus', uf: 'AM', region: 'Norte', population: 2063547 },
  { name: 'Belém', uf: 'PA', region: 'Norte', population: 1303403 },
  { name: 'Porto Velho', uf: 'RO', region: 'Norte', population: 460434 },
  { name: 'Curitiba', uf: 'PR', region: 'Sul', population: 1773718 },
  { name: 'Porto Alegre', uf: 'RS', region: 'Sul', population: 1332845 },
  { name: 'Florianópolis', uf: 'SC', region: 'Sul', population: 537211 }
];

export const SKILLS = ['React', 'TypeScript', 'Node.js', 'SQL', 'Figma', 'Docker', 'Python', 'Testes', 'Acessibilidade', 'Kotlin'];

export const DEPARTMENTS = ['Financeiro', 'Comercial', 'Operações', 'Tecnologia', 'Recursos Humanos', 'Jurídico'];

export interface Movement {
  id: number;
  title: string;
  date: string;
  amount: number;
}

export const MOVEMENTS: Movement[] = [
  { id: 1, title: 'Pagamento recebido – Pedido 4521', date: '2026-10-14', amount: 1890.5 },
  { id: 2, title: 'Fornecedor – Papelaria Ipê', date: '2026-10-13', amount: -342.9 },
  { id: 3, title: 'Assinatura do sistema', date: '2026-10-10', amount: -129 },
  { id: 4, title: 'Pagamento recebido – Pedido 4498', date: '2026-10-09', amount: 760 }
];

export const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const integer = new Intl.NumberFormat('pt-BR');

/** Imagem ilustrativa gerada (paisagem simples), para não depender de arquivos externos. */
export function illustration(hue: number, label = '') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 70% 72%)"/><stop offset="1" stop-color="hsl(${hue} 60% 88%)"/></linearGradient></defs>
<rect width="400" height="220" fill="url(#g)"/>
<circle cx="310" cy="60" r="26" fill="hsl(${(hue + 40) % 360} 90% 85%)"/>
<path d="M0 170 L90 100 L170 160 L250 90 L400 190 L400 220 L0 220 Z" fill="hsl(${hue} 45% 45%)"/>
<path d="M0 200 L120 150 L230 195 L330 150 L400 180 L400 220 L0 220 Z" fill="hsl(${hue} 50% 32%)"/>
<text x="20" y="40" font-family="sans-serif" font-size="20" font-weight="600" fill="white">${label}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Foto de perfil gerada (silhueta sobre fundo colorido). */
export function portrait(hue: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
<rect width="80" height="80" fill="hsl(${hue} 55% 70%)"/>
<circle cx="40" cy="32" r="14" fill="hsl(${hue} 40% 96%)"/>
<path d="M14 80 C16 58 64 58 66 80 Z" fill="hsl(${hue} 40% 96%)"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
