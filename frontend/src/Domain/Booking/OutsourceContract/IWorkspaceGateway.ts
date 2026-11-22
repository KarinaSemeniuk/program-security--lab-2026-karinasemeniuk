import { IManagedAccount } from "#ui-domain/Identity/Contract/IManagedAccount";
import { IResourceDraft } from "#ui-domain/Booking/Contract/IResourceDraft";
import { IServiceLicense } from "#ui-domain/Booking/Contract/IServiceLicense";
import { IPrivateBookingNote } from "#ui-domain/Booking/Contract/IPrivateBookingNote";
import { IBookableResource } from "#ui-domain/Booking/Contract/IBookableResource";
import { IBookingView } from "#ui-domain/Booking/Contract/IBookingView";
import { IAvailabilitySlot } from "#ui-domain/Booking/Contract/IAvailabilitySlot";
import { BookingPage } from "#ui-domain/Booking/Contract/BookingPage";
import { WorkspaceResult } from "#ui-domain/Booking/Contract/WorkspaceResult";
/** Cookie-authenticated workspace transport. */
export interface IWorkspaceGateway {
  /** @param id - UUID. @param calendar - Resource opening rules. @param revision - Observed version. @returns Updated resource. */
  setCalendar(id: string, calendar: {timeZone:string;weekly:{open:number;close:number}[];closedDates:string[]}, revision: number): Promise<WorkspaceResult<IBookableResource>>;
  /** @param id - Resource UUID. @param admin - Authenticated inactive projection. @returns Current details. */
  resourceDetails(id: string, admin: boolean): Promise<WorkspaceResult<IBookableResource>>;
  /** @param id - UUID. @param draft - Editable metadata. @param revision - Observed version. @returns Updated resource. */
  updateResource(id: string, draft: IResourceDraft, revision: number): Promise<WorkspaceResult<IBookableResource>>;
  /** @param id - UUID. @param revision - Observed version. @returns Active resource. */
  reactivate(id: string, revision: number): Promise<WorkspaceResult<IBookableResource>>;
  /** @param currentPassword - Exact current value. @param newPassword - Exact replacement. @returns Successful revocation outcome. */
  changePassword(currentPassword:string,newPassword:string):Promise<WorkspaceResult<boolean>>;
  /** @returns Other revoked session count. */
  revokeOthers():Promise<WorkspaceResult<number>>;
  /** @param page - Bounded page. @param search - Email search. @returns Safe Admin directory. */
  accounts(page:number,search:string):Promise<WorkspaceResult<{accounts:IManagedAccount[];total:number}>>;
  /** @param id - Target UUID. @param blocked - Desired state. @returns Safe account. */
  setBlocked(id:string,blocked:boolean):Promise<WorkspaceResult<IManagedAccount>>;
  /** @param id - UUID. @param startAt - New UTC start. @param endAt - New UTC end. @param revision - Observed version. @returns Moved booking. */
  reschedule(id:string,startAt:string,endAt:string,revision:number):Promise<WorkspaceResult<IBookingView>>;
  /** @returns Safe Admin service capabilities. */
  serviceLicense(): Promise<WorkspaceResult<IServiceLicense>>;
  /** @param id - Owned booking UUID. @returns Private note after server authentication. */
  getNote(id: string): Promise<WorkspaceResult<IPrivateBookingNote>>;
  /** @param id - Owned booking UUID. @param text - Exact note. @param revision - Observed revision. @returns New version. */
  saveNote(id: string, text: string, revision: number): Promise<WorkspaceResult<IPrivateBookingNote>>;
  /** @param admin - Include inactive resources through an admin-only route. @returns Catalog. */
  resources(admin: boolean): Promise<WorkspaceResult<IBookableResource[]>>;
  /** @param id - Resource UUID. @param date - UTC date. @returns Anonymous slots. */
  availability(id: string, date: string, timeZone?: string): Promise<WorkspaceResult<IAvailabilitySlot[]>>;
  /** @param id - Resource UUID. @param startAt - UTC start. @param endAt - UTC end. @returns Created booking. */
  book(id: string, startAt: string, endAt: string): Promise<WorkspaceResult<IBookingView>>;
  /** @param id - Booking UUID. @returns Cancelled booking. */
  cancel(id: string): Promise<WorkspaceResult<IBookingView>>;
  /** @param page - Zero-based owner history page. @returns Private page. */
  mine(page: number, filter?:string): Promise<WorkspaceResult<BookingPage>>;
  /** @param id - Resource UUID. @param startAt - UTC inclusive bound. @param endAt - UTC exclusive bound. @param page - Zero-based page. @returns Admin history. */
  history(id: string, startAt: string, endAt: string, page: number): Promise<WorkspaceResult<BookingPage>>;
  /** @param name - Display name. @param capacity - Capacity. @param minSlotMinutes - Slot size. @returns Created resource. */
  createResource(name: string, capacity: number, minSlotMinutes: number, details?: IResourceDraft): Promise<WorkspaceResult<IBookableResource>>;
  /** @param id - Resource UUID. @returns Deactivated resource. */
  deactivate(id: string): Promise<WorkspaceResult<IBookableResource>>;
}
