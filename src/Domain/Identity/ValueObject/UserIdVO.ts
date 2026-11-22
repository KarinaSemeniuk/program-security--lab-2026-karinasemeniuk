import { AEntityIdVO } from "#domain/SharedKernel/Abstracts/AEntityIdVO";

/** User identifier. Invariant: the base class guarantees a canonical UUID v4. */
export class UserIdVO extends AEntityIdVO {
  declare private readonly userIdBrand: void;

  /**
   * Creates an identifier belonging to Identity.
   * @param value - UUID v4 allocated for the user.
   * @throws InvalidEntityIdException If the base UUID invariant fails.
   */
  public constructor(value: string) {
    super(value);
  }
}
