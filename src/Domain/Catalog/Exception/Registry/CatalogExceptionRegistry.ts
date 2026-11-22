/** Immutable Catalog failure allocations. */
export enum CatalogExceptionRegistry {
  /** Context segment. */
  SEGMENT = "CAT",
  /** Invalid calendar input. */
  InvalidResourceCalendar = 6,
  /** ResourceConflict failure. */
  ResourceConflict = 5,
  /** InvalidResourceDetails failure. */
  InvalidResourceDetails = 4,
  /** InvalidResource failure. */
  InvalidResource = 1,
  /** ResourceNotFound failure. */
  ResourceNotFound = 2,
  /** ResourceAccessDenied failure. */
  ResourceAccessDenied = 3,
}
