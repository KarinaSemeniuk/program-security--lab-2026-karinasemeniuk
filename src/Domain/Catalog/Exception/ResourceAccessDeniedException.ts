import { ACatalogException } from "#domain/Catalog/Exception/Abstracts/ACatalogException";
import { CatalogExceptionRegistry } from "#domain/Catalog/Exception/Registry/CatalogExceptionRegistry";
/** Safe ResourceAccessDenied failure. */
export class ResourceAccessDeniedException extends ACatalogException {
  /** Creates a safe public failure. */
  public constructor() { super("Ця дія доступна лише адміністратору."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return CatalogExceptionRegistry.ResourceAccessDenied; }
}
