// Tempo real (`live` na entidade): quem está com a lista aberta fica sabendo quando um registro entra, muda ou sai.
// O canal é do processo; gravação que não passa pelo motor chega por `Live.notify` (o sistema guarda a instância).

export type Change = 'created' | 'updated' | 'deleted' | 'changed';

export interface LiveEvent {
  entity: string;
  id?: string;
  change: Change;
}

/** Avisos guardados por assinante lento; quem passa disso recebe um `changed` e relê tudo. */
const BUFFER = 1024;

export class Subscription implements AsyncIterator<LiveEvent> {
  private readonly queue: LiveEvent[] = [];
  private wake?: () => void;
  private closed = false;

  constructor(private readonly onClose: (s: Subscription) => void) {}

  push(ev: LiveEvent): void {
    if (this.closed) return;
    if (this.queue.length >= BUFFER) this.queue.splice(0, this.queue.length, { entity: ev.entity, change: 'changed' });
    else this.queue.push(ev);
    this.wake?.();
  }

  async next(): Promise<IteratorResult<LiveEvent>> {
    while (!this.closed && this.queue.length === 0) await new Promise<void>((r) => (this.wake = r));
    this.wake = undefined;
    const ev = this.queue.shift();
    return ev ? { value: ev, done: false } : { value: undefined, done: true };
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.onClose(this);
    this.wake?.();
  }

  return(): Promise<IteratorResult<LiveEvent>> {
    this.close();
    return Promise.resolve({ value: undefined, done: true });
  }
}

export class Live {
  private readonly subs = new Set<Subscription>();

  /** Avisa quem está com a entidade aberta. Chame depois do commit. */
  notify(entity: string, id: string | undefined, change: Change): void {
    const ev: LiveEvent = { entity, id: change === 'changed' ? undefined : id, change };
    for (const s of this.subs) s.push(ev);
  }

  subscribe(): Subscription {
    const s = new Subscription((x) => this.subs.delete(x));
    this.subs.add(s);
    return s;
  }
}
