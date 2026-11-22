import { DeactivateResourceAC } from "#application/Catalog/Command/DeactivateResourceAC";
import { ResourceDTO } from "#application/Catalog/Dto/ResourceDTO";
import { IResourceRepository } from "#domain/Catalog/OutsourceContract/IResourceRepository";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
/** Admin-only resource mutation. */
export class DeactivateResourceUC {
  /** @param resources - Catalog persistence. */
  public constructor(private readonly resources: IResourceRepository) {}
  /** @param command - Authenticated mutation. @returns Safe resource projection. @throws ARoomBookException For denied, invalid or unavailable storage. */
  public async execute(command: DeactivateResourceAC): Promise<ResourceDTO> {
    if (command.actor.role !== "ADMIN") throw new ResourceAccessDeniedException();
    return new ResourceDTO(await this.resources.deactivate(new ResourceIdVO(command.resourceId).getValue()));
  }
}
