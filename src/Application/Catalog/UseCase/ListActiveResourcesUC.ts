import { ListActiveResourcesAQ } from "#application/Catalog/Query/ListActiveResourcesAQ";
import { ResourceDTO } from "#application/Catalog/Dto/ResourceDTO";
import { IResourceRepository } from "#domain/Catalog/OutsourceContract/IResourceRepository";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
/** Role-scoped catalog query. */
export class ListActiveResourcesUC {
  /** @param resources - Catalog persistence. */
  public constructor(private readonly resources: IResourceRepository) {}
  /** @param query - Typed query. @returns Safe catalog projections. @throws ARoomBookException On denied/storage failure. */
  public async execute(query: ListActiveResourcesAQ): Promise<ResourceDTO[]> { void query; return (await this.resources.list(false)).map(resource => new ResourceDTO(resource)); }
}
