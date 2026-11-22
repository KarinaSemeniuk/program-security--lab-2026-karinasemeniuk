/** Public, non-sensitive representation of a RoomBook failure. */
export interface IRoomBookException {
  /** Returns the immutable code safe for API responses and logs. */
  getCode(): string;
  /** Returns a message that contains no credentials or implementation details. */
  getPublicMessage(): string;
}
