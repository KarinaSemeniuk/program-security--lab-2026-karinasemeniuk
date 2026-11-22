import { AEntityIdVO } from "#domain/SharedKernel/Abstracts/AEntityIdVO";

/** Stable identity required of a domain entity. */
export interface IEntity<TId extends AEntityIdVO> {
  /** Returns the entity's immutable typed identifier. */
  getId(): TId;
}
