// Lista de modelos de IA para o seletor (ModelPicker): grupos por provedor, etiquetas, busca, navegação por teclado
// e o modelo reserva. Puro: sem React e sem rede. O app monta a lista com o que o programa de IA instalado devolve.

/** Tons das etiquetas: conjunto fechado, para o contraste valer no claro e no escuro. */
export type ModelTagTone = 'neutral' | 'info' | 'success' | 'warning';

/** Etiquetas prontas, com texto traduzido: `free` "Grátis", `local` "Local", `login` "Precisa entrar". */
export type ModelFlag = 'free' | 'local' | 'login';

export interface ModelTag {
  label: string;
  tone?: ModelTagTone;
}

export interface ModelOption {
  /** Id que o programa de IA entende (`opencode/grok-code`, `anthropic/claude-sonnet`). */
  value: string;
  label: string;
  /** Uma linha embaixo do nome: contexto, custo, para que serve. */
  description?: string;
  flags?: ModelFlag[];
  /** Etiquetas livres, depois das prontas. */
  tags?: ModelTag[];
  /** Motivo de não dar para usar agora ("Entre na Anthropic para usar"). Com motivo, a opção fica desabilitada. */
  unavailable?: string;
}

export interface ModelGroup {
  id: string;
  /** Nome do provedor, no título do grupo. */
  label: string;
  /** Estado do provedor ao lado do título ("Precisa entrar", "Conectado"). */
  status?: ModelTag;
  /** Motivo que vale para as opções do grupo que não trazem o seu (provedor sem login, sem chave). */
  unavailable?: string;
  options: ModelOption[];
}

export const FLAG_TONE: Record<ModelFlag, ModelTagTone> = { free: 'success', local: 'info', login: 'warning' };

/** Sem acento, minúsculo e com espaços simples: "Clàude  Sonnet" e "claude sonnet" casam. */
export function normalizeSearch(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Motivo efetivo de indisponibilidade: o da opção, senão o do grupo. */
export function unavailableReason(group: ModelGroup, option: ModelOption): string | undefined {
  return option.unavailable ?? group.unavailable;
}

/**
 * Filtra pelo texto digitado: cada palavra precisa aparecer no nome, no id, na descrição ou no nome do provedor
 * ("anthropic son" acha o Sonnet da Anthropic). Grupo sem opção que case sai da lista. Texto vazio devolve tudo.
 */
export function filterModels(groups: ModelGroup[], query: string): ModelGroup[] {
  const words = normalizeSearch(query).split(' ').filter(Boolean);
  if (!words.length) return groups;
  return groups
    .map((g) => ({
      ...g,
      options: g.options.filter((o) => {
        const hay = normalizeSearch([o.label, o.value, o.description ?? '', g.label].join(' '));
        return words.every((w) => hay.includes(w));
      })
    }))
    .filter((g) => g.options.length > 0);
}

/** Valores que dá para escolher, na ordem da tela (as setas só passam por eles). */
export function selectableValues(groups: ModelGroup[]): string[] {
  return groups.flatMap((g) => g.options.filter((o) => !unavailableReason(g, o)).map((o) => o.value));
}

/** Próximo valor escolhível a partir do ativo: `1` desce, `-1` sobe, dando a volta. */
export function stepModel(values: string[], active: string | null, move: 1 | -1): string | null {
  if (!values.length) return null;
  const at = active === null ? -1 : values.indexOf(active);
  if (at < 0) return move === 1 ? values[0] : values[values.length - 1];
  return values[(at + move + values.length) % values.length];
}

export function findModel(groups: ModelGroup[], value: string | null): { group: ModelGroup; option: ModelOption } | null {
  if (value === null) return null;
  for (const group of groups) {
    const option = group.options.find((o) => o.value === value);
    if (option) return { group, option };
  }
  return null;
}

/** Lista do reserva: sem o modelo principal e sem os indisponíveis (reserva que não roda não serve de reserva). */
export function fallbackModels(groups: ModelGroup[], primary: string | null): ModelGroup[] {
  return groups
    .map((g) => ({ ...g, options: g.options.filter((o) => o.value !== primary && !unavailableReason(g, o)) }))
    .filter((g) => g.options.length > 0);
}

/**
 * Reserva que continua valendo depois de mudar o principal ou a lista: mantém se ainda está em `fallbackModels`;
 * limpa (`null`) se virou o principal, ficou indisponível ou sumiu.
 */
export function keepFallback(groups: ModelGroup[], primary: string | null, fallback: string | null): string | null {
  if (fallback === null) return null;
  return findModel(fallbackModels(groups, primary), fallback) ? fallback : null;
}
