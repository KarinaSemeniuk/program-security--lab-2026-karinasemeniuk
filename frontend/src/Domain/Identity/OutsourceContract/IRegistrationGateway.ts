import { IRegistrationCredentials } from "#ui-domain/Identity/Contract/IRegistrationCredentials";
import { RegistrationOutcome } from "#ui-domain/Identity/Contract/RegistrationOutcome";

/** Registration capability required from the transport adapter. */
export interface IRegistrationGateway {
  /**
   * Submits validated credentials to the configured backend.
   * @param credentials - Sensitive values used only for this explicit request.
   * @returns Public account data or a controlled failure without raw exceptions.
   */
  register(credentials: IRegistrationCredentials): Promise<Exclude<RegistrationOutcome, { status: "invalid" }>>;
}
