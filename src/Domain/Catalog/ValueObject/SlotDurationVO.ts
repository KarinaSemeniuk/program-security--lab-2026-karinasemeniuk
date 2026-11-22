import { AValueObject } from "#domain/SharedKernel/Abstracts/AValueObject";
import { InvalidResourceException } from "#domain/Catalog/Exception/InvalidResourceException";
/** Immutable slot minutes; positive integer dividing a UTC day. */
export class SlotDurationVO extends AValueObject<number> {
  /** @param value - Minutes per slot. @throws InvalidResourceException For a non-divisor/non-integer. */
  public constructor(value: number) {
    if (!Number.isInteger(value) || value < 1 || 1440 % value !== 0) throw new InvalidResourceException();
    super(value);
  }
}
