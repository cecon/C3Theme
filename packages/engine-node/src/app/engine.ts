// O motor montado: a spec carregada, as filhas, o `rowAccess`, o banco e os hooks do sistema.

import { ApiError } from '../domain/errors';
import type { Children } from '../domain/children-spec';
import type { App, Entity } from '../domain/entity';
import type { RowRule } from '../domain/row-access';
import type { Chat } from '../ports/chat';
import type { Notifications } from '../ports/notifications';
import type { Search } from '../ports/search';
import type { Store } from '../ports/store';
import type { Bell } from './bell';
import { ChatFeed } from './chat';
import type { Change, Live } from './live';
import type { System } from './system';

export class Engine {
  constructor(
    readonly app: App,
    readonly entities: Map<string, Entity>,
    readonly children: Children,
    readonly rowAccess: Map<string, RowRule[]>,
    readonly store: Store,
    readonly hooks: System,
    readonly live: Live,
    readonly bell: Bell,
    /** Porta do sino; sem ela, /_notifications responde 404. */
    readonly notifications?: Notifications,
    /** Porta da busca do Ctrl K; sem ela, /_search responde 404. */
    readonly search?: Search,
    /** Bancos a mais, das entidades com `store` (só leitura). */
    readonly stores: Map<string, Store> = new Map(),
    /** Porta do chat com o agente; sem ela, /_chat responde 404. */
    readonly chat?: Chat,
    /** Canal das conversas abertas (SSE de /_chat/{conversation}/_events). */
    readonly chatFeed: ChatFeed = new ChatFeed()
  ) {}

  /** O banco de onde a entidade é lida: o dela (`store`) ou o do app. */
  storeOf(e: Entity): Store {
    return (e.store !== undefined && this.stores.get(e.store)) || this.store;
  }

  entity(name: string): Entity {
    const e = this.entities.get(name);
    if (!e) throw ApiError.notFound(`Entidade '${name}' não existe.`);
    return e;
  }

  /** Aviso das gravações do próprio motor: só para entidade com `live`. */
  emit(entity: string, id: string | undefined, change: Change): void {
    if (this.entities.get(entity)?.live) this.live.notify(entity, id, change);
  }
}
