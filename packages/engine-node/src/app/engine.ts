// O motor montado: a spec carregada, as filhas, o `rowAccess`, o banco e os hooks do sistema.

import { ApiError } from '../domain/errors';
import type { Children } from '../domain/children-spec';
import type { App, Entity } from '../domain/entity';
import type { RowRule } from '../domain/row-access';
import type { Notifications } from '../ports/notifications';
import type { Store } from '../ports/store';
import type { Bell } from './bell';
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
    readonly notifications?: Notifications
  ) {}

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
