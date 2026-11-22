import { readFileSync, statSync } from "node:fs";
import { createPublicKey, verify, constants } from "node:crypto";
import { IInstallationLicense } from "#domain/Licensing/OutsourceContract/IInstallationLicense";
import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
import { InstallationLicense } from "#domain/Licensing/Entity/InstallationLicense";
import { LicenseStatus } from "#domain/Licensing/Contract/LicenseStatus";
import { ALicensingException } from "#domain/Licensing/Exception/Abstracts/ALicensingException";
import { InvalidLicenseException } from "#domain/Licensing/Exception/InvalidLicenseException";
/** Verifies fresh signed bytes against a configured trust key; no private key is read by the API. */
export class FileInstallationLicense implements IInstallationLicense {
  /** @param artifactPath - Signed envelope path. @param publicKeyPath - Deployment-pinned RSA public key. @param installationId - Local binding. */
  public constructor(private readonly artifactPath: string, private readonly publicKeyPath: string, private readonly installationId: string) {}
  private load(): InstallationLicense {
    try {
      if (statSync(this.artifactPath).size > 16384 || statSync(this.publicKeyPath).size > 4096) throw new InvalidLicenseException();
      const key = createPublicKey(readFileSync(this.publicKeyPath));
      if (key.asymmetricKeyType !== "rsa" || key.asymmetricKeyDetails?.modulusLength !== 3072) throw new InvalidLicenseException();
      const envelope: unknown = JSON.parse(readFileSync(this.artifactPath, "utf8"));
      if (typeof envelope !== "object" || envelope === null || Array.isArray(envelope)) throw new InvalidLicenseException();
      const e = envelope as Record<string, unknown>;
      if (Object.keys(e).length !== 2 || typeof e.payload !== "string" || typeof e.signature !== "string") throw new InvalidLicenseException();
      const payload = Buffer.from(e.payload, "base64"), signature = Buffer.from(e.signature, "base64");
      if (payload.length > 8192 || signature.length !== 384 || payload.toString("base64") !== e.payload || signature.toString("base64") !== e.signature ||
          !verify("sha256", payload, { key, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: constants.RSA_PSS_SALTLEN_DIGEST }, signature)) throw new InvalidLicenseException();
      return InstallationLicense.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(payload)) as unknown, this.installationId);
    } catch (error: unknown) { if (error instanceof ALicensingException) throw error; throw new InvalidLicenseException(); }
  }
  /** @param feature - Required capability. @throws InvalidLicenseException On any entitlement failure. */
  public assertAllows(feature: LicenseFeature): void { this.load().assertAllows(feature, new Date()); }
  /** @returns Safe status, failing closed when artifacts cannot be verified. */
  public status(): LicenseStatus { try { return this.load().status(new Date()); } catch { return { active: false, features: [], expiresAt: "" }; } }
}
