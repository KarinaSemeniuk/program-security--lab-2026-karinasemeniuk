/** Transient authentication intent; never log this object. */
export class GetCurrentUserAQ {
  /** @param token - Transient submitted value. */
  public constructor(public readonly token: string) {}
}
