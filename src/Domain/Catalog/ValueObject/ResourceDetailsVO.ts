import { ResourceType } from "#domain/Catalog/Enum/ResourceType";
import { InvalidResourceDetailsException } from "#domain/Catalog/Exception/InvalidResourceDetailsException";
/** Immutable descriptive information. Invariants: plain Unicode text, bounded fields, distinct equipment labels. */
export class ResourceDetailsVO {
  private readonly equipment: readonly string[];
  /** @param type - Supported resource kind. @param description - Multiline text, at most 2000 code points. @param location - Single line up to 200 code points. @param equipment - Up to 20 distinct trimmed labels. @throws InvalidResourceDetailsException On invalid metadata. */
  public constructor(private readonly type: ResourceType = ResourceType.Room, private readonly description = "", private readonly location = "", equipment: readonly string[] = []) {
    const badLine = (text: string) => /[\p{Cc}\p{Cs}]/u.test(text);
    if (!Object.values(ResourceType).includes(type) || [...description].length > 2000 || /[\p{Cc}\p{Cs}]/u.test(description.replace(/[\n\r\t]/g, "")) ||
      [...location].length > 200 || badLine(location) || equipment.length > 20 || equipment.some(item => !item || item !== item.trim() || [...item].length > 60 || badLine(item)) ||
      new Set(equipment.map(item => item.toLocaleLowerCase("uk-UA"))).size !== equipment.length) throw new InvalidResourceDetailsException();
    this.equipment = [...equipment];
  }
  /** @returns Validated resource kind. */
  public getType(): ResourceType { return this.type; }
  /** @returns Plain-text description. */
  public getDescription(): string { return this.description; }
  /** @returns Plain-text location. */
  public getLocation(): string { return this.location; }
  /** @returns Defensive copy of equipment labels. */
  public getEquipment(): string[] { return [...this.equipment]; }
}
