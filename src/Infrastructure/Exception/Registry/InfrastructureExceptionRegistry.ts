/** Immutable exception allocations for this boundary. */
export enum InfrastructureExceptionRegistry {
  /** Stable registry segment; numeric members below are never reused. */
  SEGMENT = "INF",
  /** NotePersistence failure. */
  NotePersistence = 12,
  /** NoteKeyConfiguration failure. */
  NoteKeyConfiguration = 11,
  /** NoteIntegrity failure. */
  NoteIntegrity = 10,
  /** NoteProtection failure. */
  NoteProtection = 9,
  /** BookingPersistence storage failure. */
  BookingPersistence = 8,
  /** CatalogPersistence storage failure. */
  CatalogPersistence = 7,
  /** Allocated code for DatabaseConnection failures. */
  DatabaseConnection = 1,
  /** Allocated code for UserPersistenceRead failures. */
  UserPersistenceRead = 2,
  /** Allocated code for UserPersistenceWrite failures. */
  UserPersistenceWrite = 3,
  /** Allocated code for PasswordHashing failures. */
  PasswordHashing = 4,
  /** Allocated code for UserIdGeneration failures. */
  UserIdGeneration = 5,
  /** Allocated code for BlocklistLoading failures. */
  BlocklistLoading = 6,
}
