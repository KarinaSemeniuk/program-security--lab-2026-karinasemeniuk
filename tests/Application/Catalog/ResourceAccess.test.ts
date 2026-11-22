import { CreateResourceUC } from "#application/Catalog/UseCase/CreateResourceUC";
import { CreateResourceAC } from "#application/Catalog/Command/CreateResourceAC";
import { ListAllResourcesUC } from "#application/Catalog/UseCase/ListAllResourcesUC";
import { ListAllResourcesAQ } from "#application/Catalog/Query/ListAllResourcesAQ";
import { DeactivateResourceUC } from "#application/Catalog/UseCase/DeactivateResourceUC";
import { DeactivateResourceAC } from "#application/Catalog/Command/DeactivateResourceAC";
import { ResourceAccessDeniedException } from "#domain/Catalog/Exception/ResourceAccessDeniedException";
import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { Resource } from "#domain/Catalog/Entity/Resource";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { SlotDurationVO } from "#domain/Catalog/ValueObject/SlotDurationVO";
const user: UserDTO = {id:"11111111-1111-4111-8111-111111111111",email:"u@example.test",role:UserRole.User,createdAt:"2026-10-30"};
describe("resource application access",()=>{
 const resource=new Resource(new ResourceIdVO(user.id),"Кімната",4,new SlotDurationVO(30));
 const repository={list:jest.fn(),find:jest.fn(),create:jest.fn(),deactivate:jest.fn()};
 beforeEach(()=>{Object.values(repository).forEach(mock=>mock.mockReset());repository.create.mockResolvedValue(resource);repository.deactivate.mockResolvedValue(resource);repository.list.mockResolvedValue([resource]);});
 it("denies every admin operation before calling storage for User",async()=>{
  await expect(new CreateResourceUC(repository).execute(new CreateResourceAC(user,"Кімната",4,30))).rejects.toThrow(ResourceAccessDeniedException);
  await expect(new DeactivateResourceUC(repository).execute(new DeactivateResourceAC(user,user.id))).rejects.toThrow(ResourceAccessDeniedException);
  await expect(new ListAllResourcesUC(repository).execute(new ListAllResourcesAQ(user))).rejects.toThrow(ResourceAccessDeniedException);
  expect(repository.create).not.toHaveBeenCalled();expect(repository.deactivate).not.toHaveBeenCalled();expect(repository.list).not.toHaveBeenCalled();
 });
 it("permits Admin operations with typed projections",async()=>{
  const admin={...user,role:UserRole.Admin};
  expect(await new CreateResourceUC(repository).execute(new CreateResourceAC(admin," Кімната ",4,30))).toMatchObject({name:"Кімната",capacity:4});
  expect(await new ListAllResourcesUC(repository).execute(new ListAllResourcesAQ(admin))).toHaveLength(1);
 });
});
