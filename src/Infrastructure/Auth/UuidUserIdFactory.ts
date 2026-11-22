import { randomUUID } from "node:crypto";
import { IUserIdFactory } from "#domain/Identity/OutsourceContract/IUserIdFactory";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { UserIdGenerationException } from "#infrastructure/Exception/UserIdGenerationException";

/** Allocates user identifiers using the runtime's cryptographic UUID provider. */
export class UuidUserIdFactory implements IUserIdFactory {
  /**
   * Allocates a fresh UUID v4 for a newly registered account.
   * @returns A validated Identity identifier.
   * @throws UserIdGenerationException If the runtime cannot allocate a UUID.
   * @throws InvalidEntityIdException If the provider returns an invalid identifier.
   */
  public create(): UserIdVO {
    try {
      return new UserIdVO(randomUUID());
    } catch (error: unknown) {
      if (error instanceof ARoomBookException) throw error;
      throw new UserIdGenerationException();
    }
  }
}
