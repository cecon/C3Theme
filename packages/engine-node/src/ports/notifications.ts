// Porta do sino (`layout.header.notifications`, spec/v0/notifications.yaml): os avisos são do sistema, que guarda,
// cria e decide de quem é cada um. Sem ela, as rotas /_notifications respondem 404.

import type { EngineRequest } from './request';

/** Um aviso, como sai em GET /_notifications. Datas em ISO 8601; `readAt` null: não lido. */
export interface Notification {
  id: string;
  title: string;
  description?: string;
  tone?: 'neutral' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
  readAt: string | null;
  /** Rota da shell aberta ao clicar (ex.: "/conversa/7"). */
  to?: string;
}

/** A página de avisos e o total de não lidos do usuário (não só os da página). */
export interface NotificationList {
  items: Notification[];
  unread: number;
}

export interface Notifications {
  /** De quem é o sino deste pedido (o id do usuário logado). A autenticação já passou pelo sistema. */
  audience(req: EngineRequest): string;
  /** Do mais novo ao mais velho, até `limit` (1 a 100). */
  list(audience: string, limit: number): Promise<NotificationList> | NotificationList;
  /** Marca como lidos os `ids` do usuário (undefined: todos) e devolve quantos sobraram não lidos. */
  markRead(audience: string, ids: string[] | undefined): Promise<number> | number;
}
