import { ACatalogException } from "#domain/Catalog/Exception/Abstracts/ACatalogException";
import { CatalogExceptionRegistry } from "#domain/Catalog/Exception/Registry/CatalogExceptionRegistry";
/** Safe ResourceConflict failure. */
export class ResourceConflictException extends ACatalogException {
  /** Creates a safe public failure. */
  public constructor() { super("Ресурс уже змінено. Завантажте актуальну версію перед збереженням."); }
  /** @returns Immutable exception allocation. */
  protected override getCodeEnum(): number { return CatalogExceptionRegistry.ResourceConflict; }
}
