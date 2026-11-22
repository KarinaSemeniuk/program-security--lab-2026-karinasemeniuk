/** Named installation capabilities; never substitutes for user authorization. */
export enum LicenseFeature {
  /** New reservation creation. */
  Booking = "booking",
  /** Owner-only private note writes. */
  PrivateNotes = "private-notes",
  /** Resource creation. */
  ResourceAdmin = "resource-admin",
}
