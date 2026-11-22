import { ACoreException } from "#domain/SharedKernel/Exception/Abstracts/ACoreException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Identifies the RouteNotFound failure without exposing sensitive inputs. */
export class RouteNotFoundException extends ACoreException {
  private static readonly MESSAGE = "Маршрут не знайдено.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(RouteNotFoundException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): CoreExceptionRegistry.RouteNotFound {
    return CoreExceptionRegistry.RouteNotFound;
  }
}
