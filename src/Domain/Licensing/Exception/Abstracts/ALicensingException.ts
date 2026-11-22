import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { LicensingExceptionRegistry } from "#domain/Licensing/Exception/Registry/LicensingExceptionRegistry";
/** Base for safe installation-entitlement failures. */
export abstract class ALicensingException extends ARoomBookException {
  /** Binds a safe message to the Licensing registry. */
  protected constructor() { super("Ця дія тимчасово недоступна для цієї інсталяції RoomBook.", LicensingExceptionRegistry); }
}
