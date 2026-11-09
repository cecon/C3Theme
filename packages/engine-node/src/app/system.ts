// Os hooks do sistema com os padrões do contrato: sem hook, todo mundo pode tudo; ação, consulta, arquivo e escrita
// delegada sem implementação são erro do sistema (500, com o motivo no log).

import { ApiError, type FieldErrors } from '../domain/errors';
import { type Clock, systemClock } from '../domain/relative-date';
import type { Rec } from '../domain/types';
import {
  ALL,
  type ActionCall,
  type ActionOutcome,
  type BulkActionCall,
  type Capabilities,
  type ChildWrite,
  type FileCall,
  type FileContent,
  type Hooks,
  type ListActionCall,
  type LookupCall,
  type OrgAccess,
  type PrefillCall,
  type Preview,
  type PreviewCall,
  type RequestContext,
  type SourceCall,
  type SourceSql,
  type WriteCall
} from '../ports/hooks';
import type { EngineRequest } from '../ports/request';
import type { Conn } from '../ports/store';

const missing = (what: string): ApiError => {
  console.error(`c3-engine-node: ${what}`);
  return ApiError.internal();
};

export class System {
  constructor(private readonly h: Hooks) {}

  orgAccess(req: EngineRequest): Promise<OrgAccess> {
    return Promise.resolve(this.h.orgAccess?.(req) ?? {});
  }
  capabilities(entity: string, branch: string | undefined, req: EngineRequest): Capabilities {
    return this.h.capabilities?.(entity, branch, req) ?? ALL;
  }
  async validate(ctx: RequestContext, entity: string, record: Rec, conn: Conn, errors: FieldErrors): Promise<void> {
    await this.h.validate?.(ctx, entity, record, conn, errors);
  }
  async validateChildren(
    ctx: RequestContext,
    entity: string,
    record: Rec,
    children: ChildWrite[],
    conn: Conn,
    errors: FieldErrors
  ): Promise<void> {
    await this.h.validateChildren?.(ctx, entity, record, children, conn, errors);
  }
  delegatesWrites(entity: string): boolean {
    return this.h.delegatesWrites?.(entity) ?? false;
  }
  write(call: WriteCall): Promise<number> {
    if (!this.h.write) throw missing(`${call.entity} delega a escrita mas o sistema não implementa write (${call.op})`);
    return this.h.write(call);
  }
  actionAllowed(entity: string, action: string, branch: string | undefined, req: EngineRequest): boolean {
    return this.h.actionAllowed?.(entity, action, branch, req) ?? true;
  }
  permitted(code: string, branch: string | undefined, req: EngineRequest): boolean {
    return this.h.permitted?.(code, branch, req) ?? true;
  }
  userValue(key: string, req: EngineRequest): unknown {
    return this.h.userValue?.(key, req) ?? null;
  }
  clock(req: EngineRequest): Clock {
    return this.h.clock?.(req) ?? systemClock();
  }
  source(call: SourceCall): Promise<SourceSql> {
    if (!this.h.source) throw missing(`${call.entity} é source system mas o sistema não implementa source`);
    return this.h.source(call);
  }
  runAction(call: ActionCall): Promise<ActionOutcome> {
    if (!this.h.runAction) throw missing(`ação ${call.entity}.${call.action} declarada mas sem runAction no sistema`);
    return this.h.runAction(call);
  }
  runBulkAction(call: BulkActionCall): Promise<ActionOutcome> {
    if (!this.h.runBulkAction) throw missing(`ação ${call.entity}.${call.action} com bulk "together" mas sem runBulkAction no sistema`);
    return this.h.runBulkAction(call);
  }
  runListAction(call: ListActionCall): Promise<ActionOutcome> {
    if (!this.h.runListAction) throw missing(`ação de lista ${call.entity}.${call.action} sem runListAction no sistema`);
    return this.h.runListAction(call);
  }
  async actionPrefill(call: PrefillCall): Promise<Rec> {
    return (await this.h.actionPrefill?.(call)) ?? {};
  }
  async previewAction(call: PreviewCall): Promise<Preview> {
    return (await this.h.previewAction?.(call)) ?? {};
  }
  lookup(call: LookupCall): Promise<Rec> {
    if (!this.h.lookup) throw missing(`consulta ${call.entity}.${call.lookup} declarada mas sem lookup no sistema`);
    return this.h.lookup(call);
  }
  readFile(call: FileCall): Promise<FileContent> {
    if (!this.h.readFile) throw missing(`${call.entity}.${call.field} é file mas o sistema não implementa readFile`);
    return this.h.readFile(call);
  }
}
