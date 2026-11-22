import { SealedNotesUC } from "#ui-application/Booking/UseCase/SealedNotesUC";
import { IResourceDraft } from "#ui-domain/Booking/Contract/IResourceDraft";
import { BookingSelectionService } from "#ui-domain/Booking/Service/BookingSelectionService";
import { IAvailabilitySlot } from "#ui-domain/Booking/Contract/IAvailabilitySlot";
import { IWorkspaceGateway } from "#ui-domain/Booking/OutsourceContract/IWorkspaceGateway";
/** Application facade for typed catalog and booking intents. Server remains authoritative. */
export class WorkspaceUC {
  /** @param gateway - Cookie-aware transport. @param selection - Client slot selection. @param sealedNotes - Optional client-side encrypted note orchestration. */
  public constructor(private readonly gateway: IWorkspaceGateway, private readonly selection = new BookingSelectionService(), public readonly sealedNotes?: SealedNotesUC) {}
  /** @param slots - Ordered slots. @param start - Selected index. @returns Available adjacent count. */
  public contiguous(slots: readonly IAvailabilitySlot[], start: number) { return this.selection.contiguous(slots, start); }
  /** @param slots - Ordered slots. @param start - Selected index. @param units - Selected slot count. @returns Typed selection. */
  public select(slots: readonly IAvailabilitySlot[], start: number, units: number) { return this.selection.select(slots, start, units); }
  /** @param id - UUID. @param calendar - Opening rules. @param revision - Observed version. @returns Save outcome. */
  public setCalendar(id: string, calendar: {timeZone:string;weekly:{open:number;close:number}[];closedDates:string[]}, revision: number) { return this.gateway.setCalendar(id, calendar, revision); }
  /** @param id - UUID. @param admin - Inactive projection. @returns Fresh detail outcome. */
  public resourceDetails(id: string, admin: boolean) { return this.gateway.resourceDetails(id, admin); }
  /** @param id - UUID. @param draft - Metadata. @param revision - Observed version. @returns Updated resource. */
  public updateResource(id: string, draft: IResourceDraft, revision: number) { return this.gateway.updateResource(id, draft, revision); }
  /** @param id - UUID. @param revision - Observed version. @returns Active resource. */
  public reactivate(id: string, revision: number) { return this.gateway.reactivate(id, revision); }
  /** @param currentPassword - Current value. @param newPassword - Exact replacement. @returns Change outcome. */
  public changePassword(currentPassword:string,newPassword:string) { return this.gateway.changePassword(currentPassword,newPassword); }
  /** @returns Other session revocation outcome. */
  public revokeOthers() { return this.gateway.revokeOthers(); }
  /** @param page - Directory page. @param search - Email substring. @returns Account page. */
  public accounts(page:number,search:string) { return this.gateway.accounts(page,search); }
  /** @param id - UUID. @param blocked - Desired state. @returns Account outcome. */
  public setBlocked(id:string,blocked:boolean) { return this.gateway.setBlocked(id,blocked); }
  /** @param id - UUID. @param startAt - New start. @param endAt - New end. @param revision - Observed version. @returns Movement outcome. */
  public reschedule(id:string,startAt:string,endAt:string,revision:number) { return this.gateway.reschedule(id,startAt,endAt,revision); }
  /** @returns Current Admin-only installation status. */
  public serviceLicense() { return this.gateway.serviceLicense(); }
  /** @param id - Owned booking UUID. @returns Private note outcome. */
  public getNote(id: string) { return this.gateway.getNote(id); }
  /** @param id - Owned booking UUID. @param text - Exact note text. @param revision - Observed version. @returns Save outcome. */
  public saveNote(id: string, text: string, revision: number) { return this.gateway.saveNote(id, text, revision); }
  /** @param admin - Admin catalog choice. @returns Catalog result. */
  public resources(admin: boolean) { return this.gateway.resources(admin); }
  /** @param id - Resource UUID. @param date - UTC day. @returns Availability result. */
  public availability(id: string, date: string, timeZone?: string) { return this.gateway.availability(id, date, timeZone); }
  /** @param id - Resource UUID. @param start - UTC start. @param end - UTC end. @returns Booking outcome. */
  public book(id: string, start: string, end: string) { return this.gateway.book(id, start, end); }
  /** @param id - Booking UUID. @returns Cancellation result. */
  public cancel(id: string) { return this.gateway.cancel(id); }
  /** @param page - Owner page. @returns Private bookings. */
  public mine(page: number,filter?:string) { return this.gateway.mine(page,filter); }
  /** @param id - Resource UUID. @param start - UTC start. @param end - UTC end. @param page - History page. @returns Admin history. */
  public history(id: string, start: string, end: string, page: number) { return this.gateway.history(id, start, end, page); }
  /** @param name - Resource label. @param capacity - Capacity. @param minutes - Slot size. @returns Created resource. */
  public createResource(name: string, capacity: number, minutes: number, details?: IResourceDraft) { return this.gateway.createResource(name, capacity, minutes, details); }
  /** @param id - Resource UUID. @returns Deactivated resource. */
  public deactivate(id: string) { return this.gateway.deactivate(id); }
}
