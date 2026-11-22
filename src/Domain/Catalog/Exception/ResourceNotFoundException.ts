import { ACatalogException } from "#domain/Catalog/Exception/Abstracts/ACatalogException";
import { CatalogExceptionRegistry } from "#domain/Catalog/Exception/Registry/CatalogExceptionRegistry";
/** Safe ResourceNotFound failure. */
export class ResourceNotFoundException extends ACatalogException {
  /** Creates a safe public failure. */
  public constructor() { super("Ресурс не знайдено."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return CatalogExceptionRegistry.ResourceNotFound; }
}
