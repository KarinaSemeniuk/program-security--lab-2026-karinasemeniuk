import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { IInstallationLicense } from "#domain/Licensing/OutsourceContract/IInstallationLicense";
import { LicenseStatus } from "#domain/Licensing/Contract/LicenseStatus";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
/** Admin-only safe installation status. */
export class GetServiceLicenseUC {
  /** @param license - Signed installation capability. */
  public constructor(private readonly license: IInstallationLicense) {}
  /** @param actor - Current server-resolved account. @returns Safe entitlement summary. @throws ResourceAccessDeniedException For non-admin callers. */
  public execute(actor: UserDTO): LicenseStatus { if (actor.role !== "ADMIN") throw new ResourceAccessDeniedException(); return this.license.status(); }
}
