/** Immutable installation-license failures. */
export enum LicensingExceptionRegistry {
  /** Registry segment. */
  SEGMENT = "LIC",
  /** Invalid claims/signature/product/installation. */
  InvalidLicense = 1,
  /** Outside the signed validity window. */
  InactiveLicense = 2,
  /** Capability not granted. */
  FeatureUnavailable = 3,
}
