import { IRegisteredAccount } from "#ui-domain/Identity/Contract/IRegisteredAccount";
import { RegistrationFieldErrors } from "#ui-domain/Identity/Contract/RegistrationFieldErrors";

/** Explicit expected outcomes; no native error or credential data crosses layers. */
export type RegistrationOutcome =
  | {
      /** Successful account creation. */
      readonly status: "created";
      /** Explicit public profile projection. */
      readonly user: IRegisteredAccount;
    }
  | {
      /** Client validation prevented a request. */
      readonly status: "invalid";
      /** Feedback for fields needing attention. */
      readonly errors: RegistrationFieldErrors;
    }
  | {
      /** A controlled transport or backend rejection. */
      readonly status: "failed";
      /** Category used for accessible form presentation. */
      readonly reason: "rejected" | "conflict" | "rate-limit" | "network" | "server" | "unexpected";
      /** Safe localized feedback; never a raw dependency message. */
      readonly message: string;
      /** Optional field associated with the rejection. */
      readonly field?: "email" | "password";
      /** Retry delay supplied by a rate-limited response. */
      readonly retryAfterSeconds?: number;
    };
