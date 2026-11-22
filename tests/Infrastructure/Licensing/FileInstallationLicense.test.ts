import { generateKeyPairSync, sign, constants, randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { FileInstallationLicense } from "#infrastructure/Licensing/FileInstallationLicense";
import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
import { InvalidLicenseException } from "#domain/Licensing/Exception/InvalidLicenseException";
import { InactiveLicenseException } from "#domain/Licensing/Exception/InactiveLicenseException";
import { LicenseFeatureUnavailableException } from "#domain/Licensing/Exception/LicenseFeatureUnavailableException";
describe("Signed installation license", () => {
  const pair = generateKeyPairSync("rsa", { modulusLength: 3072 });
  const installationId = randomUUID(); const now = Date.now();
  const claims = { productId: "roombook", installationId, licenseId: randomUUID(), holder: "Synthetic installation", issuedAt: new Date(now - 2000).toISOString(),
    notBefore: new Date(now - 1000).toISOString(), expiresAt: new Date(now + 3600_000).toISOString(), features: Object.values(LicenseFeature) };
  let directory: string; let file: string; let publicPath: string; let license: FileInstallationLicense;
  function issue(changes: object = {}): void {
    const payload = Buffer.from(JSON.stringify({ ...claims, ...changes }));
    const signature = sign("sha256", payload, { key: pair.privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: constants.RSA_PSS_SALTLEN_DIGEST });
    writeFileSync(file, JSON.stringify({ payload: payload.toString("base64"), signature: signature.toString("base64") }));
  }
  beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "roombook-license-unit-")); file = join(directory, "license.json"); publicPath = join(directory, "public.pem");
    writeFileSync(publicPath, pair.publicKey.export({ type: "spki", format: "pem" })); license = new FileInstallationLicense(file, publicPath, installationId); issue(); });
  afterEach(() => rmSync(directory, { recursive: true, force: true }));
  it("accepts correct RSA-PSS signed capabilities and returns only safe status", () => {
    for (const feature of Object.values(LicenseFeature)) expect(() => license.assertAllows(feature)).not.toThrow();
    expect(Object.keys(license.status()).sort()).toEqual(["active", "expiresAt", "features"]);
  });
  it.each([{ productId: "other" }, { installationId: randomUUID() }, { licenseId: "invalid" }, { holder: "" },
    { features: ["unknown"] }, { features: ["booking", "booking"] }, { expiresAt: "invalid" }, { extra: "not allowed" }])("rejects signed but invalid claims %p", changes => {
      issue(changes); expect(() => license.assertAllows(LicenseFeature.Booking)).toThrow(InvalidLicenseException);
    });
  it("rejects expiry and not-yet-valid licenses, even with a correct signature", () => {
    issue({ issuedAt: new Date(now - 10000).toISOString(), notBefore: new Date(now - 9000).toISOString(), expiresAt: new Date(now - 1000).toISOString() });
    expect(() => license.assertAllows(LicenseFeature.Booking)).toThrow(InactiveLicenseException); expect(license.status().active).toBe(false);
    issue({ notBefore: new Date(now + 1000_000).toISOString() }); expect(() => license.assertAllows(LicenseFeature.Booking)).toThrow(InactiveLicenseException);
  });
  it("does not grant a capability absent from signed claims", () => {
    issue({ features: [LicenseFeature.Booking] }); expect(() => license.assertAllows(LicenseFeature.PrivateNotes)).toThrow(LicenseFeatureUnavailableException);
  });
  it("rejects modified payload bytes without re-signing", () => {
    const payload = Buffer.from(JSON.stringify(claims)); const signature = sign("sha256", payload, { key: pair.privateKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: 32 });
    payload[0] = payload[0]! ^ 1; writeFileSync(file, JSON.stringify({ payload: payload.toString("base64"), signature: signature.toString("base64") }));
    expect(() => license.assertAllows(LicenseFeature.Booking)).toThrow(InvalidLicenseException); expect(license.status()).toEqual({ active: false, features: [], expiresAt: "" });
  });
  it("rejects PKCS#1 v1.5 signatures instead of accepting another scheme", () => {
    const payload = Buffer.from(JSON.stringify(claims)); const signature = sign("sha256", payload, { key: pair.privateKey, padding: constants.RSA_PKCS1_PADDING });
    writeFileSync(file, JSON.stringify({ payload: payload.toString("base64"), signature: signature.toString("base64") }));
    expect(() => license.assertAllows(LicenseFeature.Booking)).toThrow(InvalidLicenseException);
  });
  it("fails closed for missing or malformed artifacts", () => {
    writeFileSync(file, "not JSON"); expect(() => license.assertAllows(LicenseFeature.Booking)).toThrow(InvalidLicenseException);
    rmSync(file); expect(license.status().active).toBe(false);
  });
});
