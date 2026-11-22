import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";

/** Identifier allocation required by Identity. */
export interface IUserIdFactory {
  /**
   * Allocates an identifier independent of transport or persistence.
   * @returns A validated UUID v4 user identifier.
   * @throws ARoomBookException If identifier allocation fails.
   */
  create(): UserIdVO;
}
