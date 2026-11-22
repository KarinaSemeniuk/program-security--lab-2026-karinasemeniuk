import { ReactivateResourceUC } from "#application/Catalog/UseCase/ReactivateResourceUC";
import { IInstallationLicense } from "#domain/Licensing/OutsourceContract/IInstallationLicense";
import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
/** Adds installation entitlement to the existing independently authorized operation. */
export class LicensedReactivateResourceUC {
  /** @param operation - Existing typed use case. @param license - Verified installation gate. */
  public constructor(private readonly operation: Pick<ReactivateResourceUC, "execute">, private readonly license: IInstallationLicense) {}
  /** @param command - Original typed command. @returns Existing operation outcome. @throws ARoomBookException On entitlement or operation failure. */
  public async execute(command: Parameters<ReactivateResourceUC["execute"]>[0]): Promise<Awaited<ReturnType<ReactivateResourceUC["execute"]>>> {
    this.license.assertAllows(LicenseFeature.ResourceAdmin); return this.operation.execute(command);
  }
}
