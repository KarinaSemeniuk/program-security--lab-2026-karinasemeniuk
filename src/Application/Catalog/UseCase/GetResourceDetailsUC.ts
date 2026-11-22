import { GetResourceDetailsAQ } from "#application/Catalog/Query/GetResourceDetailsAQ";
import { ResourceDTO } from "#application/Catalog/Dto/ResourceDTO";
import { IResourceRepository } from "#domain/Catalog/OutsourceContract/IResourceRepository";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
import { ResourceNotFoundException } from "#domain/Catalog/Exception/ResourceNotFoundException";
/** Public active detail or explicitly authenticated Admin projection. */
export class GetResourceDetailsUC {
  /** @param resources - Catalog reader. */
  public constructor(private readonly resources: IResourceRepository) {}
  /** @param query - Lookup and optional authenticated actor. @returns Safe detail. @throws ARoomBookException On denied, missing, invalid or storage failure. */
  public async execute(query: GetResourceDetailsAQ): Promise<ResourceDTO> {
    if (query.actor && query.actor.role !== "ADMIN") throw new ResourceAccessDeniedException();
    const resource = await this.resources.find(new ResourceIdVO(query.resourceId).getValue());
    if (!resource || (!resource.isActive() && !query.actor)) throw new ResourceNotFoundException();
    return new ResourceDTO(resource);
  }
}
