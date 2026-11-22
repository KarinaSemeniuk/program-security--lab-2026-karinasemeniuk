/** Transient authentication intent; never log this object. */
export class SignOutUserAC {
  /** @param token - Transient submitted value. */
  public constructor(public readonly token: string) {}
}
