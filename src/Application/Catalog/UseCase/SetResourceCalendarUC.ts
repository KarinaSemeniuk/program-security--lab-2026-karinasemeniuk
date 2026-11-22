import { SetResourceCalendarAC } from "#application/Catalog/Command/SetResourceCalendarAC";
import { ResourceDTO } from "#application/Catalog/Dto/ResourceDTO";
import { IResourceCalendarRepository } from "#domain/Catalog/OutsourceContract/IResourceCalendarRepository";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
/** Admin-only versioned resource mutation. */
export class SetResourceCalendarUC {
  /** @param resources - Atomic catalog management. */
  public constructor(private readonly resources: IResourceCalendarRepository) {}
  /** @param command - Session-derived intent. @returns Safe resource. @throws ARoomBookException On denied, invalid, stale or storage failure. */
  public async execute(command: SetResourceCalendarAC): Promise<ResourceDTO> {
    if (command.actor.role !== "ADMIN") throw new ResourceAccessDeniedException();
    return new ResourceDTO(await this.resources.setCalendar(new ResourceIdVO(command.resourceId).getValue(), command.calendar, command.revision));
  }
}
