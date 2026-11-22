import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
import { InvalidLicenseException } from "#domain/Licensing/Exception/InvalidLicenseException";
import { InactiveLicenseException } from "#domain/Licensing/Exception/InactiveLicenseException";
import { LicenseFeatureUnavailableException } from "#domain/Licensing/Exception/LicenseFeatureUnavailableException";
import { LicenseStatus } from "#domain/Licensing/Contract/LicenseStatus";
/** Immutable signed entitlement claims. Invariants: correct product/installation, UUIDs, canonical validity bounds and known unique capabilities. */
export class InstallationLicense {
  private constructor(private readonly features: readonly LicenseFeature[], private readonly from: number, private readonly until: number) {}
  /** @param value - Verified-signature claims. @param installationId - Expected local installation binding. @returns Valid immutable entitlement. @throws InvalidLicenseException On invalid claims/binding. */
  public static parse(value: unknown, installationId: string): InstallationLicense {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new InvalidLicenseException();
    const c = value as Record<string, unknown>;
    const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
    if (Object.keys(c).length !== 8 || c.productId !== "roombook" || c.installationId !== installationId || !uuid.test(installationId) ||
        typeof c.licenseId !== "string" || !uuid.test(c.licenseId) || typeof c.holder !== "string" || !c.holder.trim() || [...c.holder].length > 100 || /[\p{Cc}\p{Cs}]/u.test(c.holder) ||
        typeof c.issuedAt !== "string" || typeof c.notBefore !== "string" || typeof c.expiresAt !== "string" ||
        !Array.isArray(c.features) || c.features.length > 3 || new Set(c.features).size !== c.features.length ||
        c.features.some(feature => !Object.values(LicenseFeature).includes(feature as LicenseFeature))) throw new InvalidLicenseException();
    const from = Date.parse(c.notBefore), until = Date.parse(c.expiresAt), issued = Date.parse(c.issuedAt);
    if (![from, until, issued].every(Number.isFinite) || new Date(from).toISOString() !== c.notBefore || new Date(until).toISOString() !== c.expiresAt ||
        new Date(issued).toISOString() !== c.issuedAt || until <= from || issued > until) throw new InvalidLicenseException();
    return new InstallationLicense([...c.features] as LicenseFeature[], from, until);
  }
  /** @param feature - Required operation. @param now - Server clock. @throws InvalidLicenseException On inactive/disabled entitlement. */
  public assertAllows(feature: LicenseFeature, now: Date): void {
    if (now.getTime() < this.from || now.getTime() >= this.until) throw new InactiveLicenseException();
    if (!this.features.includes(feature)) throw new LicenseFeatureUnavailableException();
  }
  /** @param now - Server clock. @returns Safe status without holder/identifiers/signature. */
  public status(now: Date): LicenseStatus { return { active: now.getTime() >= this.from && now.getTime() < this.until, features: [...this.features], expiresAt: new Date(this.until).toISOString() }; }
}
