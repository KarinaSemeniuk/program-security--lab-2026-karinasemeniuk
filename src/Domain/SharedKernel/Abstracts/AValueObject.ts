import { IValueObject } from "#domain/SharedKernel/Contract/IValueObject";
/** Immutable primitive shared by the project's concrete value objects. */
export abstract class AValueObject<T extends string | number | boolean> implements IValueObject<T> {
  /**
   * Retains an already validated primitive.
   * @param value - Value satisfying the concrete object's invariants.
   */
  protected constructor(private readonly value: T) {}

  /** Returns the immutable primitive represented by this value object. */
  public getValue(): T {
    return this.value;
  }
}
