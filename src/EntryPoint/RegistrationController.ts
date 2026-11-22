import { RegisterUserAC } from "#application/Identity/Command/RegisterUserAC";
import { RegisterUserUC } from "#application/Identity/UseCase/RegisterUserUC";
import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";

/** Maps untrusted registration JSON to the application command. */
export class RegistrationController {
  /**
   * Supplies the registration application entry point.
   * @param registration - Use case whose command signature is reused unchanged.
   */
  public constructor(private readonly registration: Pick<RegisterUserUC, "execute">) {}

  /**
   * Rejects unexpected fields and forwards typed credentials.
   * @param body - Untrusted JSON request body.
   * @returns The public projection of a successfully registered account.
   * @throws InvalidRequestBodyException If required fields or their types are invalid.
   * @throws ARoomBookException If registration fails.
   */
  public async register(body: unknown): Promise<UserDTO> {
    if (typeof body !== "object" || body === null || Array.isArray(body) ||
        !("email" in body) || !("password" in body) ||
        Object.keys(body).length !== 2) throw new InvalidRequestBodyException();
    const email = body.email;
    const password = body.password;
    if (typeof email !== "string" || typeof password !== "string") {
      throw new InvalidRequestBodyException();
    }
    return this.registration.execute(new RegisterUserAC(email, password));
  }
}
