import { RescheduleBookingUC } from "#application/Booking/UseCase/RescheduleBookingUC";
import { IInstallationLicense } from "#domain/Licensing/OutsourceContract/IInstallationLicense";
import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
/** Adds installation entitlement to the existing independently authorized operation. */
export class LicensedRescheduleBookingUC {
  /** @param operation - Existing typed use case. @param license - Verified installation gate. */
  public constructor(private readonly operation: Pick<RescheduleBookingUC, "execute">, private readonly license: IInstallationLicense) {}
  /** @param command - Original typed command. @returns Existing operation outcome. @throws ARoomBookException On entitlement or operation failure. */
  public async execute(command: Parameters<RescheduleBookingUC["execute"]>[0]): Promise<Awaited<ReturnType<RescheduleBookingUC["execute"]>>> {
    this.license.assertAllows(LicenseFeature.Booking); return this.operation.execute(command);
  }
}
