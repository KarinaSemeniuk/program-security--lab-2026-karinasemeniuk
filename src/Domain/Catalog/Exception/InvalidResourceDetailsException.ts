import { ACatalogException } from "#domain/Catalog/Exception/Abstracts/ACatalogException";
import { CatalogExceptionRegistry } from "#domain/Catalog/Exception/Registry/CatalogExceptionRegistry";
/** Safe InvalidResourceDetails failure. */
export class InvalidResourceDetailsException extends ACatalogException {
  /** Creates a safe public failure. */
  public constructor() { super("Перевірте тип, опис, розташування й обладнання ресурсу."); }
  /** @returns Immutable exception allocation. */
  protected override getCodeEnum(): number { return CatalogExceptionRegistry.InvalidResourceDetails; }
}
