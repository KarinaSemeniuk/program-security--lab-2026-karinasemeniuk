import { RegisterUserAC } from "#ui-application/Identity/Command/RegisterUserAC";
import { RegistrationOutcome } from "#ui-domain/Identity/Contract/RegistrationOutcome";
import { IRegistrationGateway } from "#ui-domain/Identity/OutsourceContract/IRegistrationGateway";
import { RegistrationInputService } from "#ui-domain/Identity/Service/RegistrationInputService";

/** Coordinates immediate form checks with the backend registration boundary. */
export class RegisterUserUC {
  /**
   * Supplies the validation service and transport capability.
   * @param validation - Non-sensitive local feedback provider.
   * @param gateway - Adapter responsible for the actual registration request.
   */
  public constructor(
    private readonly validation: RegistrationInputService,
    private readonly gateway: IRegistrationGateway,
  ) {}

  /**
   * Submits accepted input without sending the confirmation or a chosen role.
   * @param command - Transient credentials from one form submission.
   * @returns Field feedback, created public profile or controlled backend failure.
   */
  public async execute(command: RegisterUserAC): Promise<RegistrationOutcome> {
    const errors = this.validation.validate(command.email, command.password, command.confirmation);
    if (Object.keys(errors).length > 0) return { status: "invalid", errors };
    return this.gateway.register({
      email: command.email.trim().toLowerCase(),
      password: command.password,
    });
  }
}
