import { SavePrivateNoteUC } from "#application/Booking/UseCase/SavePrivateNoteUC";
import { IInstallationLicense } from "#domain/Licensing/OutsourceContract/IInstallationLicense";
import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
/** Adds installation entitlement to the existing independently authorized operation. */
export class LicensedSavePrivateNoteUC {
  /** @param operation - Existing typed use case. @param license - Verified installation gate. */
  public constructor(private readonly operation: Pick<SavePrivateNoteUC, "execute">, private readonly license: IInstallationLicense) {}
  /** @param command - Original typed command. @returns Existing operation outcome. @throws ARoomBookException On entitlement or operation failure. */
  public async execute(command: Parameters<SavePrivateNoteUC["execute"]>[0]): Promise<Awaited<ReturnType<SavePrivateNoteUC["execute"]>>> {
    this.license.assertAllows(LicenseFeature.PrivateNotes); return this.operation.execute(command);
  }
}
