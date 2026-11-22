import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { CatalogExceptionRegistry } from "#domain/Catalog/Exception/Registry/CatalogExceptionRegistry";
/** Binds failures to CAT. */
export abstract class ACatalogException extends ARoomBookException {
  /** @param message - Safe public message. */
  protected constructor(message: string) { super(message, CatalogExceptionRegistry); }
}
