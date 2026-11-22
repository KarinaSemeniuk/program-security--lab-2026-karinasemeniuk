/** Immutable primitive value exposed by concrete domain value objects. */
export interface IValueObject<T> {
  /** Returns the validated immutable primitive. */
  getValue(): T;
}
