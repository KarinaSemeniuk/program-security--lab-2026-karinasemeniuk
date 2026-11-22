import { ReactivateResourceAC } from "#application/Catalog/Command/ReactivateResourceAC";
import { ResourceDTO } from "#application/Catalog/Dto/ResourceDTO";
import { IResourceManagementRepository } from "#domain/Catalog/OutsourceContract/IResourceManagementRepository";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
/** Admin-only versioned resource mutation. */
export class ReactivateResourceUC {
  /** @param resources - Atomic catalog management. */
  public constructor(private readonly resources: IResourceManagementRepository) {}
  /** @param command - Session-derived intent. @returns Safe resource. @throws ARoomBookException On denied, invalid, stale or storage failure. */
  public async execute(command: ReactivateResourceAC): Promise<ResourceDTO> {
    if (command.actor.role !== "ADMIN") throw new ResourceAccessDeniedException();
    return new ResourceDTO(await this.resources.reactivate(new ResourceIdVO(command.resourceId).getValue(), command.revision));
  }
}
