import { ADomainEvent } from "#domain/SharedKernel/Abstracts/ADomainEvent";
/** Post-commit event delivery boundary. No downstream listeners are currently configured. */
export interface IBookingEventDispatcher {
  /** @param events - Successfully persisted aggregate changes. */
  dispatch(events: readonly ADomainEvent[]): void;
}
