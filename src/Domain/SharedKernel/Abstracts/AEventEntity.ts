import { ADomainEvent } from "#domain/SharedKernel/Abstracts/ADomainEvent";
/** Event queue foundation; semantic duplicates are suppressed until persistence drains it. */
export abstract class AEventEntity {
  private readonly events = new Map<string, ADomainEvent>();
  /** @param event - Meaningful state change. @param key - Semantic deduplication key. */
  protected triggerEvent(event: ADomainEvent, key: string): void { if (!this.events.has(key)) this.events.set(key, event); }
  /** @returns Pending changes exactly once after successful persistence. */
  public pullEvents(): ADomainEvent[] { const result = [...this.events.values()]; this.events.clear(); return result; }
}
