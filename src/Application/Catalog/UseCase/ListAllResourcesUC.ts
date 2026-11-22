import { ListAllResourcesAQ } from "#application/Catalog/Query/ListAllResourcesAQ";
import { ResourceDTO } from "#application/Catalog/Dto/ResourceDTO";
import { IResourceRepository } from "#domain/Catalog/OutsourceContract/IResourceRepository";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
/** Role-scoped catalog query. */
export class ListAllResourcesUC {
  /** @param resources - Catalog persistence. */
  public constructor(private readonly resources: IResourceRepository) {}
  /** @param query - Typed query. @returns Safe catalog projections. @throws ARoomBookException On denied/storage failure. */
  public async execute(query: ListAllResourcesAQ): Promise<ResourceDTO[]> { if (query.actor.role !== "ADMIN") throw new ResourceAccessDeniedException(); return (await this.resources.list(true)).map(resource => new ResourceDTO(resource)); }
}
