import type { ReactNode } from 'react';

/** Situação de um provedor (programa de IA do computador) na lista. */
export type ProviderStatus = 'missing' | 'installing' | 'installed' | 'needs-login' | 'signing-in' | 'ready' | 'error';

export interface ProviderItem {
  id: string;
  name: string;
  /** Ícone ou logo; sem ele entra um ícone genérico. */
  icon?: ReactNode;
  /** Uma linha de detalhe: caminho, versão ou como instalar. */
  detail?: string;
  status: ProviderStatus;
  /** Progresso da instalação, de 0 a 100; sem valor a barra fica indeterminada. */
  progress?: number;
  /** Mensagem do estado `error`. */
  error?: string;
}

/** Ações que o app recebe; o componente não faz chamada nenhuma. Ação sem callback não aparece. */
export interface ProviderActions {
  onInstall?: (id: string) => void;
  onSignIn?: (id: string) => void;
  onRetry?: (id: string) => void;
  onCheckUpdate?: (id: string) => void;
  onRemove?: (id: string) => void;
}
