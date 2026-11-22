import { IManagedAccount } from "#ui-domain/Identity/Contract/IManagedAccount";
import { IResourceDraft } from "#ui-domain/Booking/Contract/IResourceDraft";
import { IServiceLicense } from "#ui-domain/Booking/Contract/IServiceLicense";
import { IPrivateBookingNote } from "#ui-domain/Booking/Contract/IPrivateBookingNote";
import { IWorkspaceGateway } from "#ui-domain/Booking/OutsourceContract/IWorkspaceGateway";
import { IBookableResource } from "#ui-domain/Booking/Contract/IBookableResource";
import { IBookingView } from "#ui-domain/Booking/Contract/IBookingView";
import { IAvailabilitySlot } from "#ui-domain/Booking/Contract/IAvailabilitySlot";
import { BookingPage } from "#ui-domain/Booking/Contract/BookingPage";
import { WorkspaceResult } from "#ui-domain/Booking/Contract/WorkspaceResult";
/** Validates response contracts and maps known failure codes to safe Ukrainian messages. */
export class WorkspaceHttpGateway implements IWorkspaceGateway {
  /** @param base - Public API base, empty for the local proxy. */
  public constructor(private readonly base: string) {}
  private object(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
  private resource(value: unknown): value is IBookableResource {
    return this.object(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.capacity === "number" && typeof value.minSlotMinutes === "number" && typeof value.isActive === "boolean" &&
      (value.type === "ROOM" || value.type === "DESK") && typeof value.timeZone === "string" && Array.isArray(value.weekly) && value.weekly.length === 7 && value.weekly.every(day => this.object(day) && Number.isInteger(day.open) && Number.isInteger(day.close)) && Array.isArray(value.closedDates) && value.closedDates.every(date => typeof date === "string") && typeof value.description === "string" && typeof value.location === "string" &&
      Array.isArray(value.equipment) && value.equipment.every(item => typeof item === "string") && Number.isSafeInteger(value.revision) && Number(value.revision) >= 0;
  }
  private account(value:unknown):value is IManagedAccount { return this.object(value) && typeof value.id==="string" && typeof value.email==="string" && (value.role==="USER"||value.role==="ADMIN") && typeof value.isBlocked==="boolean" && typeof value.createdAt==="string"; }
  private booking(value: unknown): value is IBookingView {
    return this.object(value) && (value.revision === undefined || (Number.isSafeInteger(value.revision) && Number(value.revision)>=0)) && ["id", "resourceId", "resourceName", "userId", "startAt", "endAt", "createdAt"].every(key => typeof value[key] === "string") &&
      typeof value.status === "string" && ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"].includes(value.status);
  }
  private slot(value: unknown): value is IAvailabilitySlot {
    return this.object(value) && typeof value.startAt === "string" && typeof value.endAt === "string" && typeof value.available === "boolean";
  }
  private page(value: unknown): value is BookingPage {
    return this.object(value) && Array.isArray(value.bookings) && value.bookings.every(item => this.booking(item)) && typeof value.total === "number";
  }
  private async request<T>(path: string, decode: (value: unknown) => T | undefined, body?: object): Promise<WorkspaceResult<T>> {
    try {
      const response = await fetch(this.base + "/api" + path, { method: body ? "POST" : "GET", credentials: "include", cache: "no-store",
        headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
      const value: unknown = await response.json();
      if (!response.ok) {
        const code = this.object(value) && this.object(value.error) && typeof value.error.code === "string" ? value.error.code : "";
        const messages: Record<string, string> = {
          "RB.BKG.10": "Нотатка містить недопустимі символи або перевищує 2000 символів.",
          "RB.BKG.11": "Нотатку вже змінено в іншій вкладці. Завантажте актуальну версію.",
          "RB.INF.10": "Не вдалося перевірити збережену нотатку. Дані не відображено.",
          "RB.INF.11": "Нотатки тимчасово недоступні. Спробуйте пізніше.",
          "RB.IDN.2": "Новий пароль має містити щонайменше 15 символів.",
          "RB.IDN.3": "Новий пароль перевищує 72 байти UTF-8.",
          "RB.IDN.4": "Оберіть інший пароль: цей є у списку поширених значень.",
          "RB.IDN.5": "Пароль містить недопустиму послідовність Unicode.",
          "RB.IDN.13": "Облікові дані вже змінилися. Повторіть вхід.",
          "RB.IDN.15": "Поточний пароль неправильний.",
          "RB.BKG.13": "Бронювання вже змінено. Оновіть список і повторіть спробу.",
          "RB.CAT.6": "Перевірте часовий пояс, години роботи й закриті дати.",
          "RB.BKG.12": "Простір зачинений у вибраний час. Оновіть розклад.",
          "RB.CAT.4": "Перевірте тип, опис, розташування й обладнання ресурсу.",
          "RB.CAT.5": "Ресурс уже змінено. Натисніть «Перезавантажити дані», перевірте актуальну версію й повторіть зміни.",
          "RB.CAT.1": "Перевірте назву, місткість і тривалість інтервалу.", "RB.CAT.2": "Ресурс недоступний. Оновіть каталог.",
          "RB.BKG.2": "Цей час уже зайняли. Оберіть інший інтервал.", "RB.BKG.3": "Ресурс більше не приймає бронювання.",
          "RB.BKG.4": "Час і тривалість мають відповідати інтервалам ресурсу.", "RB.BKG.5": "Оберіть час у майбутньому.",
          "RB.BKG.8": "Скасування доступне щонайменше за дві години до початку.", "RB.BKG.9": "Це бронювання вже завершено або скасовано.",
        };
        return { status: "failed", unauthorized: response.status === 401,
          message: response.status === 401 ? "Сеанс завершився. Увійдіть знову." : response.status === 403 ? (code.startsWith("RB.LIC.") ? "Ця можливість недоступна для інсталяції. Зверніться до адміністратора сервісу." : "Недостатньо прав для цієї дії.") :
            response.status === 429 ? "Забагато спроб. Зачекайте хвилину й повторіть." : messages[code] ?? "Не вдалося виконати дію. Перевірте дані й повторіть спробу." };
      }
      const data = decode(value); if (data === undefined) return { status: "failed", unauthorized: false, message: "Сервер повернув неочікувані дані." };
      return { status: "ok", data };
    } catch { return { status: "failed", unauthorized: false, message: "Немає зв’язку із сервером. Спробуйте ще раз." }; }
  }
  /** @param id - UUID. @param calendar - Opening rules. @param revision - Observed version. @returns Saved resource. */
  public setCalendar(id: string, calendar: {timeZone:string;weekly:{open:number;close:number}[];closedDates:string[]}, revision: number): Promise<WorkspaceResult<IBookableResource>> { return this.resourceResult(`/resources/${encodeURIComponent(id)}/calendar`, {...calendar,revision}); }
  private resourceResult(path: string, body?: object): Promise<WorkspaceResult<IBookableResource>> {
    return this.request(path, value => this.object(value) && this.resource(value.resource) ? value.resource : undefined, body);
  }
  /** @param id - UUID. @param admin - Inactive projection. @returns Fresh details. */
  public resourceDetails(id: string, admin: boolean): Promise<WorkspaceResult<IBookableResource>> { return this.resourceResult(`${admin ? "/admin" : ""}/resources/${encodeURIComponent(id)}`); }
  /** @param id - UUID. @param draft - Metadata. @param revision - Observed version. @returns Updated resource. */
  public updateResource(id: string, draft: IResourceDraft, revision: number): Promise<WorkspaceResult<IBookableResource>> { return this.resourceResult(`/resources/${encodeURIComponent(id)}/update`, { ...draft, revision }); }
  /** @param id - UUID. @param revision - Observed version. @returns Active resource. */
  public reactivate(id: string, revision: number): Promise<WorkspaceResult<IBookableResource>> { return this.resourceResult(`/resources/${encodeURIComponent(id)}/reactivate`, { revision }); }
  /** @param currentPassword - Exact current credential. @param newPassword - Exact replacement. @returns Verified success. */
  public changePassword(currentPassword:string,newPassword:string):Promise<WorkspaceResult<boolean>> { return this.request("/account/password",value=>this.object(value)&&value.changed===true?true:undefined,{currentPassword,newPassword}); }
  /** @returns Verified revocation count. */
  public revokeOthers():Promise<WorkspaceResult<number>> { return this.request("/account/sessions/revoke-others",value=>this.object(value)&&Number.isSafeInteger(value.revoked)&&Number(value.revoked)>=0?Number(value.revoked):undefined,{}); }
  /** @param page - Directory page. @param search - Email search. @returns Safe Admin accounts. */
  public accounts(page:number,search:string):Promise<WorkspaceResult<{accounts:IManagedAccount[];total:number}>> { return this.request(`/admin/accounts?${new URLSearchParams({page:String(page),search})}`,value=>this.object(value)&&Array.isArray(value.accounts)&&value.accounts.every(account=>this.account(account))&&Number.isSafeInteger(value.total)&&Number(value.total)>=0?{accounts:value.accounts,total:Number(value.total)}:undefined); }
  /** @param id - UUID. @param blocked - Desired state. @returns Updated account. */
  public setBlocked(id:string,blocked:boolean):Promise<WorkspaceResult<IManagedAccount>> { return this.request(`/admin/accounts/${encodeURIComponent(id)}/block`,value=>this.object(value)&&this.account(value.account)?value.account:undefined,{blocked}); }
  /** @param id - UUID. @param startAt - UTC start. @param endAt - UTC end. @param revision - Observed version. @returns Moved booking. */
  public reschedule(id:string,startAt:string,endAt:string,revision:number):Promise<WorkspaceResult<IBookingView>> { return this.bookingResult(`/bookings/${encodeURIComponent(id)}/reschedule`,{startAt,endAt,revision}); }
  /** @returns Verified Admin-only status projection. */
  public serviceLicense(): Promise<WorkspaceResult<IServiceLicense>> {
    return this.request("/admin/service", value => {
      if (!this.object(value) || !this.object(value.service)) return undefined;
      const service = value.service;
      return typeof service.active === "boolean" && Array.isArray(service.features) && service.features.every(feature => typeof feature === "string") &&
        typeof service.expiresAt === "string" ? { active: service.active, features: service.features as string[], expiresAt: service.expiresAt } : undefined;
    });
  }
  private decodeNote(value: unknown): IPrivateBookingNote | undefined {
    if (!this.object(value) || !this.object(value.note)) return undefined;
    const note = value.note;
    return typeof note.text === "string" && typeof note.revision === "number" && Number.isInteger(note.revision) && note.revision >= 0 &&
      typeof note.updatedAt === "string" ? { text: note.text, revision: note.revision, updatedAt: note.updatedAt } : undefined;
  }
  /** @param id - Owned booking UUID. @returns Validated owner-only note. */
  public getNote(id: string): Promise<WorkspaceResult<IPrivateBookingNote>> {
    return this.request(`/bookings/${encodeURIComponent(id)}/private-note`, value => this.decodeNote(value));
  }
  /** @param id - Owned booking UUID. @param text - Exact note. @param revision - Observed version. @returns New note version. */
  public saveNote(id: string, text: string, revision: number): Promise<WorkspaceResult<IPrivateBookingNote>> {
    return this.request(`/bookings/${encodeURIComponent(id)}/private-note`, value => this.decodeNote(value), { text, revision });
  }
  /** @param admin - Admin projection flag. @returns Validated resources. */
  public resources(admin: boolean): Promise<WorkspaceResult<IBookableResource[]>> {
    return this.request(admin ? "/admin/resources" : "/resources", value => this.object(value) && Array.isArray(value.resources) && value.resources.every(item => this.resource(item)) ? value.resources : undefined);
  }
  /** @param id - UUID. @param date - UTC date. @returns Validated slots. */
  public availability(id: string, date: string, timeZone?: string): Promise<WorkspaceResult<IAvailabilitySlot[]>> {
    return this.request(`/resources/${encodeURIComponent(id)}/availability?date=${encodeURIComponent(date)}${timeZone ? "&timeZone=" + encodeURIComponent(timeZone) : ""}`, value => this.object(value) && Array.isArray(value.slots) && value.slots.every(item => this.slot(item)) ? value.slots : undefined);
  }
  private bookingResult(path: string, body: object): Promise<WorkspaceResult<IBookingView>> {
    return this.request(path, value => this.object(value) && this.booking(value.booking) ? value.booking : undefined, body);
  }
  /** @param id - Resource UUID. @param startAt - UTC start. @param endAt - UTC end. @returns Created booking. */
  public book(id: string, startAt: string, endAt: string): Promise<WorkspaceResult<IBookingView>> { return this.bookingResult("/bookings", { resourceId: id, startAt, endAt }); }
  /** @param id - Booking UUID. @returns Cancelled booking. */
  public cancel(id: string): Promise<WorkspaceResult<IBookingView>> { return this.bookingResult(`/bookings/${encodeURIComponent(id)}/cancel`, {}); }
  /** @param page - Zero-based page. @returns Owner history. */
  public mine(page: number,filter?:string): Promise<WorkspaceResult<BookingPage>> { return this.request(`/bookings/mine?page=${page}${filter?"&filter="+encodeURIComponent(filter):""}`, value => this.page(value) ? value : undefined); }
  /** @param id - UUID. @param startAt - UTC start. @param endAt - UTC end. @param page - Zero-based page. @returns Admin history. */
  public history(id: string, startAt: string, endAt: string, page: number): Promise<WorkspaceResult<BookingPage>> {
    return this.request(`/resources/${encodeURIComponent(id)}/bookings?${new URLSearchParams({ startAt, endAt, page: String(page) })}`, value => this.page(value) ? value : undefined);
  }
  /** @param name - Display name. @param capacity - Capacity. @param minSlotMinutes - Slot length. @returns Created resource. */
  public createResource(name: string, capacity: number, minSlotMinutes: number, details?: IResourceDraft): Promise<WorkspaceResult<IBookableResource>> {
    return this.request("/resources", value => this.object(value) && this.resource(value.resource) ? value.resource : undefined, { ...details, name, capacity, minSlotMinutes });
  }
  /** @param id - UUID. @returns Inactive resource. */
  public deactivate(id: string): Promise<WorkspaceResult<IBookableResource>> {
    return this.request(`/resources/${encodeURIComponent(id)}/deactivate`, value => this.object(value) && this.resource(value.resource) ? value.resource : undefined, {});
  }
}
