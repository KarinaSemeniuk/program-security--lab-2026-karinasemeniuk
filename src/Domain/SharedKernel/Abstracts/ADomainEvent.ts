/** Immutable domain-event envelope. Event identifiers are supplied by Infrastructure. */
export abstract class ADomainEvent {
  /** Event schema version. */
  public readonly schemaVersion = 1;
  /** @param eventId - Unique event UUID. @param sourceId - Aggregate UUID. @param timestamp - Canonical occurrence instant. */
  protected constructor(public readonly eventId: string, public readonly sourceId: string, public readonly timestamp: string) {}
  /** @returns Stable context event name. */
  public abstract getEventName(): string;
  /** @returns Payload constructor for serialization metadata. */
  public abstract getEventDataClass(): { readonly name: string; readonly prototype: object };
  /** @returns Serializable event payload. */
  public abstract getData(): object;
}
