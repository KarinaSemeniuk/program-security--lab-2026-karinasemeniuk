import { CreateBookingUC } from "#application/BookingCatalog/UseCase/CreateBookingUC";
import { IInstallationLicense } from "#domain/Licensing/OutsourceContract/IInstallationLicense";
import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
/** Adds installation entitlement to the existing independently authorized operation. */
export class LicensedCreateBookingUC {
  /** @param operation - Existing typed use case. @param license - Verified installation gate. */
  public constructor(private readonly operation: Pick<CreateBookingUC, "execute">, private readonly license: IInstallationLicense) {}
  /** @param command - Original typed command. @returns Existing operation outcome. @throws ARoomBookException On entitlement or operation failure. */
  public async execute(command: Parameters<CreateBookingUC["execute"]>[0]): Promise<Awaited<ReturnType<CreateBookingUC["execute"]>>> {
    this.license.assertAllows(LicenseFeature.Booking); return this.operation.execute(command);
  }
}
