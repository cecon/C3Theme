// Formatos das respostas do contrato que a shell lê (sino, busca, pedido livre). Sem React.

export interface RawReply {
  status: number;
  contentType: string;
  body: string;
}

/** Um achado de GET /_search (spec/v0/search.yaml). `group` agrupa na paleta; `path` é a rota da shell. */
export interface SearchResult {
  kind: string;
  group: string;
  title: string;
  snippet?: string | null;
  path: string;
  icon?: string | null;
  at?: string | null;
}

/** Aviso do sino (spec/v0/notifications.yaml). `readAt` null: não lido. `to`: rota da shell aberta ao clicar. */
export interface C3Notification {
  id: string;
  title: string;
  description?: string;
  tone?: 'neutral' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
  readAt: string | null;
  to?: string;
}

export interface NotificationList {
  items: C3Notification[];
  unread: number;
}
