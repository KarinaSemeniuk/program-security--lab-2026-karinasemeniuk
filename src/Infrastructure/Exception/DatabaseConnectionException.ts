import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";

/** Identifies the DatabaseConnection failure without exposing sensitive inputs. */
export class DatabaseConnectionException extends AInfrastructureException {
  private static readonly MESSAGE = "Не вдалося підключитися до бази даних.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(DatabaseConnectionException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): InfrastructureExceptionRegistry.DatabaseConnection {
    return InfrastructureExceptionRegistry.DatabaseConnection;
  }
}
