import { CreateResourceAC } from "#application/Catalog/Command/CreateResourceAC";
import { ResourceDTO } from "#application/Catalog/Dto/ResourceDTO";
import { IResourceRepository } from "#domain/Catalog/OutsourceContract/IResourceRepository";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
/** Admin-only resource mutation. */
export class CreateResourceUC {
  /** @param resources - Catalog persistence. */
  public constructor(private readonly resources: IResourceRepository) {}
  /** @param command - Authenticated mutation. @returns Safe resource projection. @throws ARoomBookException For denied, invalid or unavailable storage. */
  public async execute(command: CreateResourceAC): Promise<ResourceDTO> {
    if (command.actor.role !== "ADMIN") throw new ResourceAccessDeniedException();
    return new ResourceDTO(await this.resources.create(command.name.trim(), command.capacity, command.minSlotMinutes, command.details));
  }
}
