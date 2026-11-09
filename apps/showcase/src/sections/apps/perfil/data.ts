import { useSyncExternalStore } from 'react';

export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf: string;
  /** dd/mm/aaaa */
  birthDate: string;
  jobTitle: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  bio: string;
}

/** Campos que contam para o "perfil completo". */
export const PROFILE_FIELDS: { key: keyof Profile; label: string }[] = [
  { key: 'firstName', label: 'Nome' },
  { key: 'lastName', label: 'Sobrenome' },
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefone' },
  { key: 'cpf', label: 'CPF' },
  { key: 'birthDate', label: 'Data de nascimento' },
  { key: 'jobTitle', label: 'Cargo' },
  { key: 'address', label: 'Endereço' },
  { key: 'city', label: 'Cidade' },
  { key: 'state', label: 'UF' },
  { key: 'zip', label: 'CEP' },
  { key: 'website', label: 'Site' },
  { key: 'bio', label: 'Sobre você' }
];

const INITIAL: Profile = {
  firstName: 'Ana',
  lastName: 'Souza',
  email: 'ana@c3theme.dev',
  phone: '(11) 98765-4321',
  cpf: '123.456.789-09',
  birthDate: '14/03/1990',
  jobTitle: 'Gerente de operações',
  address: 'Rua Haddock Lobo, 595, ap. 41',
  city: 'São Paulo',
  state: 'SP',
  zip: '01414-001',
  website: '',
  bio: ''
};

export function completion(p: Profile) {
  const missing = PROFILE_FIELDS.filter((f) => !p[f.key].trim());
  return { percent: ((PROFILE_FIELDS.length - missing.length) / PROFILE_FIELDS.length) * 100, missing };
}

// perfil em memória, compartilhado entre "Perfil do usuário" e "Configurações da conta"
let profile = INITIAL;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useProfile(): [Profile, (p: Profile) => void] {
  const value = useSyncExternalStore(subscribe, () => profile);
  return [
    value,
    (p) => {
      profile = p;
      listeners.forEach((l) => l());
    }
  ];
}

export const fullName = (p: Profile) => `${p.firstName} ${p.lastName}`.trim();
export const initials = (p: Profile) => `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();

export type CardBrand = 'Visa' | 'Mastercard' | 'Elo';
export interface SavedCard {
  id: string;
  brand: CardBrand;
  holder: string;
  last4: string;
  /** mm/aa */
  expiry: string;
  primary: boolean;
}

export const CARDS: SavedCard[] = [
  { id: 'k1', brand: 'Mastercard', holder: 'ANA P SOUZA', last4: '4821', expiry: '08/28', primary: true },
  { id: 'k2', brand: 'Visa', holder: 'ANA P SOUZA', last4: '1057', expiry: '11/27', primary: false },
  { id: 'k3', brand: 'Elo', holder: 'C3 SOLUCOES LTDA', last4: '7310', expiry: '03/29', primary: false }
];

export const CHARGES = [
  { id: 'h1', date: '05/10/2026', description: 'Plano Profissional · outubro', value: 'R$ 189,00', card: '•••• 4821' },
  { id: 'h2', date: '05/09/2026', description: 'Plano Profissional · setembro', value: 'R$ 189,00', card: '•••• 4821' },
  { id: 'h3', date: '22/08/2026', description: 'Usuários adicionais (2)', value: 'R$ 58,00', card: '•••• 1057' }
];

export type Role = 'Proprietário' | 'Administrador' | 'Gerente' | 'Colaborador' | 'Leitor';
export const ROLES: { value: Role; hint: string }[] = [
  { value: 'Administrador', hint: 'Tudo, inclusive cobrança e equipe' },
  { value: 'Gerente', hint: 'Cadastros, relatórios e aprovações' },
  { value: 'Colaborador', hint: 'Cria e edita registros' },
  { value: 'Leitor', hint: 'Só visualiza' }
];

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ativo' | 'convidado';
  since: string;
}

export const MEMBERS: Member[] = [
  { id: 'm1', name: 'Ana Souza', email: 'ana@c3theme.dev', role: 'Proprietário', status: 'ativo', since: 'jan/2024' },
  { id: 'm2', name: 'Bruno Carvalho', email: 'bruno.carvalho@c3theme.dev', role: 'Administrador', status: 'ativo', since: 'mar/2024' },
  { id: 'm3', name: 'Camila Rocha', email: 'camila.rocha@c3theme.dev', role: 'Gerente', status: 'ativo', since: 'jul/2024' },
  { id: 'm4', name: 'Diego Martins', email: 'diego.martins@c3theme.dev', role: 'Colaborador', status: 'ativo', since: 'fev/2025' },
  { id: 'm5', name: '', email: 'fernanda.alves@email.com', role: 'Leitor', status: 'convidado', since: 'há 2 dias' }
];

export const SESSIONS = [
  { id: 's1', device: 'Chrome no Windows', place: 'São Paulo, SP', when: 'Sessão atual', current: true, kind: 'desktop' as const },
  { id: 's2', device: 'App no iPhone', place: 'São Paulo, SP', when: 'há 3 horas', current: false, kind: 'mobile' as const },
  { id: 's3', device: 'Safari no macOS', place: 'Campinas, SP', when: 'há 4 dias', current: false, kind: 'desktop' as const }
];

export const DEVICES = [
  { id: 'd1', name: 'Notebook do escritório', detail: 'Windows 11 · Chrome', last: 'agora' },
  { id: 'd2', name: 'iPhone da Ana', detail: 'iOS 19 · app C3', last: 'há 3 horas' },
  { id: 'd3', name: 'MacBook pessoal', detail: 'macOS · Safari', last: 'há 4 dias' }
];
