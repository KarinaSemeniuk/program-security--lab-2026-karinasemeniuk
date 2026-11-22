import { AccessToken } from "#domain/Identity/Contract/AccessToken";
/** Persistent active sessions enable immediate revocation across server instances. */
export interface ISessionRepository {
  /** @param session - Issued token identity. @throws ARoomBookException On persistence failure. */
  create(session: AccessToken): Promise<void>;
  /** @param session - Verified token identity. @returns Whether this exact unexpired session remains active. @throws ARoomBookException On lookup failure. */
  isActive(session: AccessToken): Promise<boolean>;
  /** @param session - Verified token identity. @throws ARoomBookException On revocation failure. */
  revoke(session: AccessToken): Promise<void>;
}
