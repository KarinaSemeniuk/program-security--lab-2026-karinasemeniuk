import { ACatalogException } from "#domain/Catalog/Exception/Abstracts/ACatalogException";
import { CatalogExceptionRegistry } from "#domain/Catalog/Exception/Registry/CatalogExceptionRegistry";
/** Safe InvalidResource failure. */
export class InvalidResourceException extends ACatalogException {
  /** Creates a safe public failure. */
  public constructor() { super("Перевірте назву, місткість і тривалість інтервалу."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return CatalogExceptionRegistry.InvalidResource; }
}
