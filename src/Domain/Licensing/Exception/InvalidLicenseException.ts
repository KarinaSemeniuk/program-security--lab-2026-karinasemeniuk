import { ALicensingException } from "#domain/Licensing/Exception/Abstracts/ALicensingException";
import { LicensingExceptionRegistry } from "#domain/Licensing/Exception/Registry/LicensingExceptionRegistry";
/** Safe InvalidLicense failure. */
export class InvalidLicenseException extends ALicensingException {
  /** Creates a safe entitlement failure. */
  public constructor() { super(); }
  /** @returns Immutable allocation. */
  protected override getCodeEnum(): number { return LicensingExceptionRegistry.InvalidLicense; }
}
