import { ListMyBookingsUC } from "#application/Booking/UseCase/ListMyBookingsUC";
import { ListMyBookingsAQ } from "#application/Booking/Query/ListMyBookingsAQ";
import { ListBookingsForResourceUC } from "#application/BookingCatalog/UseCase/ListBookingsForResourceUC";
import { ListBookingsForResourceAQ } from "#application/BookingCatalog/Query/ListBookingsForResourceAQ";
import { GetResourceAvailabilityUC } from "#application/BookingCatalog/UseCase/GetResourceAvailabilityUC";
import { GetResourceAvailabilityAQ } from "#application/BookingCatalog/Query/GetResourceAvailabilityAQ";
import { BookingAccessDeniedException } from "#domain/Booking/Exception/BookingAccessDeniedException";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
import { UserRole } from "#domain/Identity/Enum/UserRole";
const actor={id:"11111111-1111-4111-8111-111111111111",email:"u@example.test",role:UserRole.User,createdAt:"2026-10-30"};
const bookings={place:jest.fn(),cancel:jest.fn(),mine:jest.fn(),forResource:jest.fn(),occupied:jest.fn(),completeEnded:jest.fn()};
describe("booking query access",()=>{
 beforeEach(()=>{Object.values(bookings).forEach(mock=>mock.mockReset());bookings.mine.mockResolvedValue({bookings:[],total:0,resourceNames:{}});});
 it("scopes owner lookup to the resolved identity",async()=>{
  await new ListMyBookingsUC(bookings).execute(new ListMyBookingsAQ(actor,0));
  expect(bookings.mine).toHaveBeenCalledWith(actor.id,0);
 });
 it("forbids User history before reading storage",async()=>{
  await expect(new ListBookingsForResourceUC(bookings).execute(new ListBookingsForResourceAQ(actor,actor.id,"2026-11-01T00:00:00.000Z","2026-11-02T00:00:00.000Z",0))).rejects.toThrow(BookingAccessDeniedException);
  expect(bookings.forResource).not.toHaveBeenCalled();
 });
 it.each([-1,0.5,10001,NaN])("rejects invalid pagination",async page=>{
  await expect(new ListMyBookingsUC(bookings).execute(new ListMyBookingsAQ(actor,page))).rejects.toThrow(InvalidRequestBodyException);
 });
 it("rejects invalid dates before availability reads",async()=>{
  const resources={find:jest.fn(),list:jest.fn(),create:jest.fn(),deactivate:jest.fn()};
  const usecase=new GetResourceAvailabilityUC(resources,bookings);
  await expect(usecase.execute(new GetResourceAvailabilityAQ(actor.id,"2026-02-30"))).rejects.toThrow(InvalidRequestBodyException);
  expect(resources.find).not.toHaveBeenCalled();
 });
});
