// Porta dos dados e ações das configurações em modal (#119). O motor desenha o que a spec declara; os valores e a
// gravação são do sistema, que passa esta porta no <C3Shell>.

/** Valor de uma linha: o que o controle devolve (booleano, texto, número) ou nulo quando a linha não tem valor. */
export type SettingsValue = string | number | boolean | null;

/** O que o sistema entrega ao modal: valores por linha e a versão mostrada no rodapé. */
export interface SettingsData {
  /** id da linha → valor; o que faltar fica com o valor da spec */
  values?: Readonly<Record<string, SettingsValue>>;
  /** versão do sistema (rodapé do modal) */
  version?: string;
}

/** A linha que mudou, com onde ela mora. */
export interface SettingsChange {
  modal: 'personal' | 'server';
  section: string;
  /** caminho da subpágina, quando a linha está nela */
  page?: string;
  row: string;
  value: SettingsValue;
}

/** Ação disparada por uma linha `action`. */
export interface SettingsAction {
  modal: 'personal' | 'server';
  section: string;
  page?: string;
  row: string;
  action: string;
}

/**
 * Porta das configurações: `load` enche os valores iniciais e a versão; `change` grava uma mudança (o modal mostra
 * salvando/salvo enquanto ela acontece); `action` dispara uma ação de linha, como escolher uma pasta.
 */
export interface SettingsPort {
  load(): Promise<SettingsData>;
  change?(change: SettingsChange): Promise<void>;
  action?(action: SettingsAction): Promise<void>;
}
