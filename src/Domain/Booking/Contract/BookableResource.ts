/** Stable Catalog projection for creation-time rules, never an embedded Resource aggregate. */
export interface BookableResource {
  /** Validated Catalog opening decision for this interval; absent on legacy internal callers. */
  readonly isOpen?: boolean;
  /** Resource identity. */
  readonly id: string;
  /** Resource label. */
  readonly name: string;
  /** Latest activation flag. */
  readonly isActive: boolean;
  /** Latest slot duration. */
  readonly minSlotMinutes: number;
}
