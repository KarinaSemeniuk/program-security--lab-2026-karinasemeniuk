/** Exact verified cookie credential, never serialized in an outcome. */
export class RevokeOtherSessionsAC {
  /** @param token - Current cookie token. */
  public constructor(public readonly token:string) {}
}
