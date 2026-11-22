import { IExceptionCodeRegistry } from "#domain/SharedKernel/Contract/IExceptionCodeRegistry";
import { IRoomBookException } from "#domain/SharedKernel/Contract/IRoomBookException";

/** Base for failures crossing RoomBook layer boundaries. */
export abstract class ARoomBookException extends Error implements IRoomBookException {
  private static readonly PREFIX = "RB";
  private readonly registry: IExceptionCodeRegistry;

  /**
   * Associates a public failure message with its immutable registry.
   * @param message - Non-sensitive explanation of the failed operation.
   * @param registry - Owner of the exception's segment.
   */
  protected constructor(message: string, registry: IExceptionCodeRegistry) {
    super(message);
    this.name = new.target.name;
    this.registry = registry;
  }

  /** Returns the stable external identifier of this failure. */
  public getCode(): string {
    return ARoomBookException.PREFIX + "." + this.registry.SEGMENT + "." + this.getCodeEnum();
  }

  /** Returns the safe message suitable for presentation to an API client. */
  public getPublicMessage(): string {
    return this.message;
  }

  /** Supplies the numeric member allocated by the owning registry. */
  protected abstract getCodeEnum(): number;
}
