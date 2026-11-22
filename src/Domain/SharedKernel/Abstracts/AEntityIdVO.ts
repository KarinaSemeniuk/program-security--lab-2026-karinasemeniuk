import { AValueObject } from "#domain/SharedKernel/Abstracts/AValueObject";
import { InvalidEntityIdException } from "#domain/SharedKernel/Exception/InvalidEntityIdException";

/**
 * Immutable UUID v4 identifier shared by concrete entity identifiers.
 * Invariant: its canonical lower-case value is a valid UUID v4.
 */
export abstract class AEntityIdVO extends AValueObject<string> {
  /**
   * Validates and canonicalizes an entity identifier.
   * @param value - UUID v4 supplied by the identifier provider.
   * @throws InvalidEntityIdException If the value is not a UUID v4.
   */
  protected constructor(value: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new InvalidEntityIdException();
    }
    super(value.toLowerCase());
  }
}
