import { SetResourceCalendarUC } from "#application/Catalog/UseCase/SetResourceCalendarUC";
import { IInstallationLicense } from "#domain/Licensing/OutsourceContract/IInstallationLicense";
import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
/** Adds installation entitlement to the existing independently authorized operation. */
export class LicensedSetResourceCalendarUC {
  /** @param operation - Existing typed use case. @param license - Verified installation gate. */
  public constructor(private readonly operation: Pick<SetResourceCalendarUC, "execute">, private readonly license: IInstallationLicense) {}
  /** @param command - Original typed command. @returns Existing operation outcome. @throws ARoomBookException On entitlement or operation failure. */
  public async execute(command: Parameters<SetResourceCalendarUC["execute"]>[0]): Promise<Awaited<ReturnType<SetResourceCalendarUC["execute"]>>> {
    this.license.assertAllows(LicenseFeature.ResourceAdmin); return this.operation.execute(command);
  }
}
