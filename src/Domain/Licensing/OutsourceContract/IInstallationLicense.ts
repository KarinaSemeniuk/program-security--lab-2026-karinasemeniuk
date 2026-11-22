import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
import { LicenseStatus } from "#domain/Licensing/Contract/LicenseStatus";
/** Trusted installation entitlement boundary. */
export interface IInstallationLicense {
  /** @param feature - Required capability. @throws LicenseRejectedException When signature, binding, validity or capability fails. */
  assertAllows(feature: LicenseFeature): void;
  /** @returns Safe current entitlement status. */
  status(): LicenseStatus;
}
