import { RegisterUserAC } from "#application/Identity/Command/RegisterUserAC";
import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { RegisterUserService } from "#domain/Identity/Service/RegisterUserService";

/** Coordinates registration and its public projection. */
export class RegisterUserUC {
  /**
   * Supplies the domain registration service.
   * @param registration - Service enforcing Identity's invariants.
   */
  public constructor(private readonly registration: Pick<RegisterUserService, "register">) {}

  /**
   * Executes an account-creation intent.
   * @param command - Transient registration credentials.
   * @returns Public account data after successful persistence.
   * @throws ARoomBookException If domain validation or an outward contract fails.
   */
  public async execute(command: RegisterUserAC): Promise<UserDTO> {
    return new UserDTO(await this.registration.register(command.email, command.password));
  }
}
