import { Resource } from "#domain/Catalog/Entity/Resource";
import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
import { ResourceType } from "#domain/Catalog/Enum/ResourceType";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { SlotDurationVO } from "#domain/Catalog/ValueObject/SlotDurationVO";
import { InvalidResourceDetailsException } from "#domain/Catalog/Exception/InvalidResourceDetailsException";
import { InvalidResourceException } from "#domain/Catalog/Exception/InvalidResourceException";
import { ResourceConflictException } from "#domain/Catalog/Exception/ResourceConflictException";
const make = () => new Resource(new ResourceIdVO("11111111-1111-4111-8111-111111111111"), "Кімната", 4, new SlotDurationVO(30));
describe("domain.catalog.resource details and lifecycle", () => {
  it("allows exact multiline Unicode and safely copies equipment", () => {
    const labels = ["Екран"]; const details = new ResourceDetailsVO(ResourceType.Desk, "💚".repeat(2000), "Поверх 2", labels);
    labels.push("Змінено"); details.getEquipment().push("Змінено");
    expect(details.getEquipment()).toEqual(["Екран"]); expect(details.getDescription()).toHaveLength(4000);
    expect(new ResourceDetailsVO(ResourceType.Room, "Рядок\n\tІнший\r\n<script>text</script>").getDescription()).toContain("<script>");
  });
  it.each([
    () => new ResourceDetailsVO("HOTEL" as ResourceType),
    () => new ResourceDetailsVO(ResourceType.Room, "💚".repeat(2001)),
    () => new ResourceDetailsVO(ResourceType.Room, "bad\u0000"),
    () => new ResourceDetailsVO(ResourceType.Room, "\ud800"),
    () => new ResourceDetailsVO(ResourceType.Room, "", "x".repeat(201)),
    () => new ResourceDetailsVO(ResourceType.Room, "", "a\nb"),
    () => new ResourceDetailsVO(ResourceType.Room, "", "", ["Wi-Fi", "wi-fi"]),
    () => new ResourceDetailsVO(ResourceType.Room, "", "", [" Екран"]),
    () => new ResourceDetailsVO(ResourceType.Room, "", "", [""]),
    () => new ResourceDetailsVO(ResourceType.Room, "", "", ["x".repeat(61)]),
    () => new ResourceDetailsVO(ResourceType.Room, "", "", Array.from({length:21}, (_, i) => String(i))),
  ])("rejects invalid metadata", invalid => expect(invalid).toThrow(InvalidResourceDetailsException));
  it("updates metadata without changing identity, grid or activation", () => {
    const resource = make(); const details = new ResourceDetailsVO(ResourceType.Desk, "Опис", "Зона А", ["Wi-Fi"]);
    resource.update(" Нове місце ", 2, details, 0);
    expect(resource.getName()).toBe("Нове місце"); expect(resource.getCapacity()).toBe(2);
    expect(resource.getSlot().getValue()).toBe(30); expect(resource.isActive()).toBe(true); expect(resource.getRevision()).toBe(1);
    expect(resource.getDetails()).toBe(details);
  });
  it("rejects stale writes and invalid edits without partial mutation", () => {
    const resource = make(); resource.deactivate();
    expect(() => resource.update("Нове", 2, new ResourceDetailsVO(), 0)).toThrow(ResourceConflictException);
    expect(() => resource.reactivate(0)).toThrow(ResourceConflictException);
    expect(() => resource.update("Нове", 0, new ResourceDetailsVO(), 1)).toThrow(InvalidResourceException);
    expect(resource.getName()).toBe("Кімната"); expect(resource.getRevision()).toBe(1); expect(resource.isActive()).toBe(false);
  });
  it("versions activation transitions, keeping repeated requests idempotent", () => {
    const resource = make(); resource.deactivate(); resource.deactivate(); expect(resource.getRevision()).toBe(1);
    resource.reactivate(1); resource.reactivate(2); expect(resource.getRevision()).toBe(2); expect(resource.isActive()).toBe(true);
    for (const version of [-1, NaN, 1.5, Number.MAX_SAFE_INTEGER + 1]) expect(() => resource.reactivate(version)).toThrow(ResourceConflictException);
  });
});
