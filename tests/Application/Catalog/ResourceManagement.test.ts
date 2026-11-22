import { UpdateResourceUC } from "#application/Catalog/UseCase/UpdateResourceUC";
import { ReactivateResourceUC } from "#application/Catalog/UseCase/ReactivateResourceUC";
import { GetResourceDetailsUC } from "#application/Catalog/UseCase/GetResourceDetailsUC";
import { UpdateResourceAC } from "#application/Catalog/Command/UpdateResourceAC";
import { ReactivateResourceAC } from "#application/Catalog/Command/ReactivateResourceAC";
import { GetResourceDetailsAQ } from "#application/Catalog/Query/GetResourceDetailsAQ";
import { LicensedUpdateResourceUC } from "#application/CatalogLicensing/UseCase/LicensedUpdateResourceUC";
import { LicensedReactivateResourceUC } from "#application/CatalogLicensing/UseCase/LicensedReactivateResourceUC";
import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
import { Resource } from "#domain/Catalog/Entity/Resource";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { SlotDurationVO } from "#domain/Catalog/ValueObject/SlotDurationVO";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
import { ResourceNotFoundException } from "#domain/Catalog/Exception/ResourceNotFoundException";
import { LicenseFeature } from "#domain/Licensing/Enum/LicenseFeature";
import { LicenseFeatureUnavailableException } from "#domain/Licensing/Exception/LicenseFeatureUnavailableException";
const id = "11111111-1111-4111-8111-111111111111";
const user = { id, email: "u@example.test", role: UserRole.User, createdAt: "2026-10-30" };
const admin = {...user, role: UserRole.Admin};
describe("application.catalog.management", () => {
  const resource = new Resource(new ResourceIdVO(id), "Кімната", 4, new SlotDurationVO(30), false);
  const repository = { update: jest.fn(), reactivate: jest.fn(), find: jest.fn(), list: jest.fn(), create: jest.fn(), deactivate: jest.fn() };
  beforeEach(() => { Object.values(repository).forEach(mock => mock.mockReset()); repository.find.mockResolvedValue(resource); repository.update.mockResolvedValue(resource); repository.reactivate.mockResolvedValue(resource); });
  it("denies User before storage access", async () => {
    await expect(new UpdateResourceUC(repository).execute(new UpdateResourceAC(user, id, "Новий", 2, new ResourceDetailsVO(), 0))).rejects.toThrow(ResourceAccessDeniedException);
    await expect(new ReactivateResourceUC(repository).execute(new ReactivateResourceAC(user, id, 0))).rejects.toThrow(ResourceAccessDeniedException);
    await expect(new GetResourceDetailsUC(repository).execute(new GetResourceDetailsAQ(id, user))).rejects.toThrow(ResourceAccessDeniedException);
    expect(repository.update).not.toHaveBeenCalled(); expect(repository.reactivate).not.toHaveBeenCalled(); expect(repository.find).not.toHaveBeenCalled();
  });
  it("hides inactive details publicly but permits Admin", async () => {
    await expect(new GetResourceDetailsUC(repository).execute(new GetResourceDetailsAQ(id))).rejects.toThrow(ResourceNotFoundException);
    expect(await new GetResourceDetailsUC(repository).execute(new GetResourceDetailsAQ(id, admin))).toMatchObject({id, isActive:false, revision:0});
    repository.find.mockResolvedValue(undefined);
    await expect(new GetResourceDetailsUC(repository).execute(new GetResourceDetailsAQ(id, admin))).rejects.toThrow(ResourceNotFoundException);
  });
  it("passes the observed revision and typed metadata for Admin", async () => {
    const details = new ResourceDetailsVO();
    await new UpdateResourceUC(repository).execute(new UpdateResourceAC(admin, id, "Новий", 2, details, 3));
    expect(repository.update).toHaveBeenCalledWith(id, "Новий", 2, details, 3);
    await new ReactivateResourceUC(repository).execute(new ReactivateResourceAC(admin, id, 3));
    expect(repository.reactivate).toHaveBeenCalledWith(id, 3);
  });
  it("requires resource administration entitlement before mutation", async () => {
    const gate = { assertAllows: jest.fn(() => { throw new LicenseFeatureUnavailableException(); }), status: jest.fn() };
    await expect(new LicensedUpdateResourceUC(new UpdateResourceUC(repository), gate).execute(new UpdateResourceAC(admin, id, "Новий", 2, new ResourceDetailsVO(), 0))).rejects.toThrow(LicenseFeatureUnavailableException);
    await expect(new LicensedReactivateResourceUC(new ReactivateResourceUC(repository), gate).execute(new ReactivateResourceAC(admin, id, 0))).rejects.toThrow(LicenseFeatureUnavailableException);
    expect(gate.assertAllows).toHaveBeenCalledWith(LicenseFeature.ResourceAdmin); expect(repository.update).not.toHaveBeenCalled(); expect(repository.reactivate).not.toHaveBeenCalled();
  });
});
