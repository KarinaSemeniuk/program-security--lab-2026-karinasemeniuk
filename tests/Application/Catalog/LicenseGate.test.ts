import { LicensedCreateResourceUC } from "#application/CatalogLicensing/UseCase/LicensedCreateResourceUC";
import { CreateResourceAC } from "#application/Catalog/Command/CreateResourceAC";
import { GetServiceLicenseUC } from "#application/CatalogLicensing/UseCase/GetServiceLicenseUC";
import { InactiveLicenseException } from "#domain/Licensing/Exception/InactiveLicenseException";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { randomUUID } from "node:crypto";
describe("Installation gate and user authorization remain independent", () => {
  const actor = { id: randomUUID(), email: "u@example.test", role: UserRole.User, createdAt: "2026-10-30" };
  const operation = { execute: jest.fn() }; const license = { assertAllows: jest.fn(), status: jest.fn() };
  beforeEach(() => { operation.execute.mockReset(); license.assertAllows.mockReset(); license.status.mockReset(); });
  it("rejects before mutation if the installation license fails", async () => {
    license.assertAllows.mockImplementation(() => { throw new InactiveLicenseException(); });
    await expect(new LicensedCreateResourceUC(operation, license).execute(new CreateResourceAC(actor, "Room", 4, 30))).rejects.toThrow(InactiveLicenseException);
    expect(operation.execute).not.toHaveBeenCalled();
  });
  it("preserves the typed original command and requires separate admin status authorization", async () => {
    const command = new CreateResourceAC(actor, "Room", 4, 30); await new LicensedCreateResourceUC(operation, license).execute(command);
    expect(operation.execute).toHaveBeenCalledWith(command);
    expect(() => new GetServiceLicenseUC(license).execute(actor)).toThrow(ResourceAccessDeniedException); expect(license.status).not.toHaveBeenCalled();
  });
});
