import { AValueObject } from "#domain/SharedKernel/Abstracts/AValueObject";
import { InvalidEmailException } from "#domain/Identity/Exception/InvalidEmailException";

/**
 * Account email in RoomBook's supported ASCII dot-atom/DNS profile.
 * Invariants: valid supported syntax, lower-case canonical value, length <=254.
 */
export class EmailVO extends AValueObject<string> {
  /**
   * Validates the supported mailbox syntax before account lookup.
   * @param value - Submitted email; surrounding whitespace is removed.
   * @throws InvalidEmailException If the address is outside the supported profile.
   */
  public constructor(value: string) {
    const normalized = value.trim().toLowerCase();
    const parts = normalized.split("@");
    const local = parts[0] ?? "";
    const domain = parts[1] ?? "";
    const labels = domain.split(".");
    const localValid = local.length >= 1 && local.length <= 64 &&
      /^[a-z0-9!#$%&'*+/=?^_\x60{|}~.-]+$/.test(local) &&
      !local.startsWith(".") && !local.endsWith(".") && !local.includes("..");
    const domainValid = labels.length >= 2 && labels.every((label) =>
      label.length >= 1 && label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
    if (normalized.length > 254 || parts.length !== 2 || !localValid || !domainValid) {
      throw new InvalidEmailException();
    }
    super(normalized);
  }
}
