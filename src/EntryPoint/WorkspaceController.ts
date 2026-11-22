import { ChangePasswordUC } from "#application/Identity/UseCase/ChangePasswordUC";
import { ChangePasswordAC } from "#application/Identity/Command/ChangePasswordAC";
import { ManageAccountsUC } from "#application/Identity/UseCase/ManageAccountsUC";
import { SetAccountBlockedAC } from "#application/Identity/Command/SetAccountBlockedAC";
import { ListAccountsAQ } from "#application/Identity/Query/ListAccountsAQ";
import { RevokeOtherSessionsUC } from "#application/Identity/UseCase/RevokeOtherSessionsUC";
import { RevokeOtherSessionsAC } from "#application/Identity/Command/RevokeOtherSessionsAC";
import { RescheduleBookingUC } from "#application/Booking/UseCase/RescheduleBookingUC";
import { RescheduleBookingAC } from "#application/Booking/Command/RescheduleBookingAC";
import { SetResourceCalendarUC } from "#application/Catalog/UseCase/SetResourceCalendarUC";
import { SetResourceCalendarAC } from "#application/Catalog/Command/SetResourceCalendarAC";
import { ResourceCalendarVO } from "#domain/Catalog/ValueObject/ResourceCalendarVO";
import express, { type Router, type Request } from "express";
import { AuthenticationController } from "#entrypoint/AuthenticationController";
import { RegistrationRateLimiter } from "#entrypoint/RegistrationRateLimiter";
import { GetCurrentUserUC } from "#application/Identity/UseCase/GetCurrentUserUC";
import { GetCurrentUserAQ } from "#application/Identity/Query/GetCurrentUserAQ";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
import { OriginNotAllowedException } from "#domain/SharedKernel/Exception/OriginNotAllowedException";
import { UnsupportedMediaTypeException } from "#domain/SharedKernel/Exception/UnsupportedMediaTypeException";
import { RateLimitExceededException } from "#domain/SharedKernel/Exception/RateLimitExceededException";
import { CreateResourceUC } from "#application/Catalog/UseCase/CreateResourceUC";
import { CreateResourceAC } from "#application/Catalog/Command/CreateResourceAC";
import { DeactivateResourceUC } from "#application/Catalog/UseCase/DeactivateResourceUC";
import { DeactivateResourceAC } from "#application/Catalog/Command/DeactivateResourceAC";
import { ListActiveResourcesUC } from "#application/Catalog/UseCase/ListActiveResourcesUC";
import { ListActiveResourcesAQ } from "#application/Catalog/Query/ListActiveResourcesAQ";
import { ListAllResourcesUC } from "#application/Catalog/UseCase/ListAllResourcesUC";
import { ListAllResourcesAQ } from "#application/Catalog/Query/ListAllResourcesAQ";
import { CreateBookingUC } from "#application/BookingCatalog/UseCase/CreateBookingUC";
import { CreateBookingAC } from "#application/BookingCatalog/Command/CreateBookingAC";
import { CancelBookingUC } from "#application/Booking/UseCase/CancelBookingUC";
import { CancelBookingAC } from "#application/Booking/Command/CancelBookingAC";
import { ListMyBookingsUC } from "#application/Booking/UseCase/ListMyBookingsUC";
import { ListMyBookingsAQ } from "#application/Booking/Query/ListMyBookingsAQ";
import { ListBookingsForResourceUC } from "#application/BookingCatalog/UseCase/ListBookingsForResourceUC";
import { ListBookingsForResourceAQ } from "#application/BookingCatalog/Query/ListBookingsForResourceAQ";
import { GetResourceAvailabilityUC } from "#application/BookingCatalog/UseCase/GetResourceAvailabilityUC";
import { GetResourceAvailabilityAQ } from "#application/BookingCatalog/Query/GetResourceAvailabilityAQ";
import { GetPrivateNoteUC } from "#application/Booking/UseCase/GetPrivateNoteUC";
import { SavePrivateNoteUC } from "#application/Booking/UseCase/SavePrivateNoteUC";
import { GetPrivateNoteAQ } from "#application/Booking/Query/GetPrivateNoteAQ";
import { SavePrivateNoteAC } from "#application/Booking/Command/SavePrivateNoteAC";
import { GetServiceLicenseUC } from "#application/CatalogLicensing/UseCase/GetServiceLicenseUC";
import { UpdateResourceUC } from "#application/Catalog/UseCase/UpdateResourceUC";
import { UpdateResourceAC } from "#application/Catalog/Command/UpdateResourceAC";
import { ReactivateResourceUC } from "#application/Catalog/UseCase/ReactivateResourceUC";
import { ReactivateResourceAC } from "#application/Catalog/Command/ReactivateResourceAC";
import { GetResourceDetailsUC } from "#application/Catalog/UseCase/GetResourceDetailsUC";
import { GetResourceDetailsAQ } from "#application/Catalog/Query/GetResourceDetailsAQ";
import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
import { ResourceType } from "#domain/Catalog/Enum/ResourceType";
/** Routes map exact request contracts to typed use cases; identities never come from JSON. */
export class WorkspaceController {
  private readonly passwordLimiter = new RegistrationRateLimiter(5, 60_000);
  private readonly limiter = new RegistrationRateLimiter(10, 60_000);
  /** @param current - Active-session resolver. @param authentication - Cookie reader. @param origin - Exact trusted browser origin. @param operations - Typed application capabilities. */
  public constructor(private readonly current: Pick<GetCurrentUserUC, "execute">,
    private readonly authentication: Pick<AuthenticationController, "cookie">, private readonly origin: string,
    private readonly operations: {
      changePassword: ChangePasswordUC; accounts: ManageAccountsUC; revokeOthers: RevokeOtherSessionsUC;
      setCalendar: Pick<SetResourceCalendarUC, "execute">;
      updateResource: Pick<UpdateResourceUC, "execute">; reactivateResource: Pick<ReactivateResourceUC, "execute">; resourceDetails: GetResourceDetailsUC;
      createResource: Pick<CreateResourceUC, "execute">; deactivateResource: DeactivateResourceUC;
      activeResources: ListActiveResourcesUC; allResources: ListAllResourcesUC;
      rescheduleBooking: Pick<RescheduleBookingUC,"execute">;
      createBooking: Pick<CreateBookingUC, "execute">; cancelBooking: CancelBookingUC; mine: ListMyBookingsUC;
      history: ListBookingsForResourceUC; availability: GetResourceAvailabilityUC;
      licenseStatus: GetServiceLicenseUC; getNote: GetPrivateNoteUC; saveNote: Pick<SavePrivateNoteUC, "execute">;
    }) {}
  private actor(request: Request) { return this.current.execute(new GetCurrentUserAQ(this.authentication.cookie(request))); }
  /** @param body - Unknown JSON. @param keys - Exact allowed fields. @returns Validated object shape. @throws InvalidRequestBodyException On extra/missing/non-object input. */
  public object(body: unknown, keys: readonly string[]): Record<string, unknown> {
    if (typeof body !== "object" || body === null || Array.isArray(body) || Object.keys(body).length !== keys.length || keys.some(key => !(key in body))) throw new InvalidRequestBodyException();
    return body as Record<string, unknown>;
  }
  private text(value: unknown): string { if (typeof value !== "string") throw new InvalidRequestBodyException(); return value; }
  private details(body: Record<string, unknown>): ResourceDetailsVO {
    if (!Array.isArray(body.equipment) || !body.equipment.every(item => typeof item === "string")) throw new InvalidRequestBodyException();
    return new ResourceDetailsVO(this.text(body.type) as ResourceType, this.text(body.description), this.text(body.location), body.equipment);
  }
  private integer(value: unknown): number { if (typeof value !== "number" || !Number.isInteger(value)) throw new InvalidRequestBodyException(); return value; }
  private query(request: Request, keys: readonly string[]): void {
    if (Object.keys(request.query).some(key => !keys.includes(key))) throw new InvalidRequestBodyException();
  }
  private page(value: unknown): number {
    if (value === undefined) return 0;
    if (typeof value !== "string" || !/^(0|[1-9]\d{0,4})$/.test(value) || Number(value) > 10000) throw new InvalidRequestBodyException();
    return Number(value);
  }
  /** @returns Catalog and booking router ready for /api mounting. */
  public routes(): Router {
    const router = express.Router();
    router.use((_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });
    router.use((request, response, next) => {
      if (request.method !== "POST") { next(); return; }
      try {
        if (request.get("origin") !== this.origin || request.get("sec-fetch-site") === "cross-site") throw new OriginNotAllowedException();
        if (request.path === "/bookings") {
          try { this.limiter.consume(request.socket.remoteAddress ?? "unknown"); }
          catch (error: unknown) { if (error instanceof RateLimitExceededException) response.set("Retry-After", "60"); throw error; }
        }
        if (!request.is("application/json")) throw new UnsupportedMediaTypeException();
        next();
      } catch (error: unknown) { next(error); }
    });
    router.use(express.json({ limit: "32kb", strict: true, inflate: false }));
    router.get("/resources", async (request, response, next) => {
      try { this.query(request, []); response.json({ resources: await this.operations.activeResources.execute(new ListActiveResourcesAQ()) }); }
      catch (error: unknown) { next(error); }
    });
    router.get("/admin/resources", async (request, response, next) => {
      try { const actor = await this.actor(request); this.query(request, []); response.json({ resources: await this.operations.allResources.execute(new ListAllResourcesAQ(actor)) }); }
      catch (error: unknown) { next(error); }
    });
    router.post("/resources", async (request, response, next) => {
      try {
        const actor = await this.actor(request); const extended = typeof request.body === "object" && request.body !== null && "type" in request.body;
        const body = this.object(request.body as unknown, extended ? ["name", "capacity", "minSlotMinutes", "type", "description", "location", "equipment"] : ["name", "capacity", "minSlotMinutes"]);
        const resource = await this.operations.createResource.execute(new CreateResourceAC(actor, this.text(body.name), this.integer(body.capacity), this.integer(body.minSlotMinutes), extended ? this.details(body) : undefined));
        response.status(201).json({ resource });
      } catch (error: unknown) { next(error); }
    });
    router.get("/resources/:id", async (request, response, next) => {
      try { this.query(request, []); response.json({ resource: await this.operations.resourceDetails.execute(new GetResourceDetailsAQ(request.params.id!)) }); } catch (error: unknown) { next(error); }
    });
    router.get("/admin/resources/:id", async (request, response, next) => {
      try { const actor = await this.actor(request); this.query(request, []); response.json({ resource: await this.operations.resourceDetails.execute(new GetResourceDetailsAQ(request.params.id!, actor)) }); } catch (error: unknown) { next(error); }
    });
    router.post("/resources/:id/calendar", async (request, response, next) => {
      try { const actor = await this.actor(request); const body = this.object(request.body as unknown, ["timeZone", "weekly", "closedDates", "revision"]);
        if (!Array.isArray(body.weekly) || !Array.isArray(body.closedDates) || !body.closedDates.every(value => typeof value === "string")) throw new InvalidRequestBodyException();
        const weekly = body.weekly.map(value => { const day = this.object(value, ["open", "close"]); return {open:this.integer(day.open),close:this.integer(day.close)}; });
        const calendar = new ResourceCalendarVO(this.text(body.timeZone), weekly, body.closedDates);
        response.json({ resource: await this.operations.setCalendar.execute(new SetResourceCalendarAC(actor, request.params.id!, calendar, this.integer(body.revision))) });
      } catch (error: unknown) { next(error); }
    });
    router.post("/resources/:id/update", async (request, response, next) => {
      try { const actor = await this.actor(request); const body = this.object(request.body as unknown, ["name", "capacity", "type", "description", "location", "equipment", "revision"]);
        response.json({ resource: await this.operations.updateResource.execute(new UpdateResourceAC(actor, request.params.id!, this.text(body.name), this.integer(body.capacity), this.details(body), this.integer(body.revision))) });
      } catch (error: unknown) { next(error); }
    });
    router.post("/resources/:id/reactivate", async (request, response, next) => {
      try { const actor = await this.actor(request); const body = this.object(request.body as unknown, ["revision"]);
        response.json({ resource: await this.operations.reactivateResource.execute(new ReactivateResourceAC(actor, request.params.id!, this.integer(body.revision))) });
      } catch (error: unknown) { next(error); }
    });
    router.post("/resources/:id/deactivate", async (request, response, next) => {
      try { const actor = await this.actor(request); this.object(request.body as unknown, []);
        response.json({ resource: await this.operations.deactivateResource.execute(new DeactivateResourceAC(actor, request.params.id!)) });
      } catch (error: unknown) { next(error); }
    });
    router.get("/resources/:id/availability", async (request, response, next) => {
      try { this.query(request, ["date", "timeZone"]); response.json({ slots: await this.operations.availability.execute(new GetResourceAvailabilityAQ(request.params.id!, this.text(request.query.date), request.query.timeZone === undefined ? "UTC" : this.text(request.query.timeZone))) }); }
      catch (error: unknown) { next(error); }
    });
    router.post("/bookings", async (request, response, next) => {
      try {
        const actor = await this.actor(request); const body = this.object(request.body as unknown, ["resourceId", "startAt", "endAt"]);
        response.status(201).json({ booking: await this.operations.createBooking.execute(new CreateBookingAC(actor, this.text(body.resourceId), this.text(body.startAt), this.text(body.endAt))) });
      } catch (error: unknown) { next(error); }
    });
    router.get("/bookings/mine", async (request, response, next) => {
      try { const actor = await this.actor(request); this.query(request, ["page","filter"]); response.json(await this.operations.mine.execute(new ListMyBookingsAQ(actor, this.page(request.query.page), request.query.filter===undefined?"all":this.text(request.query.filter)))); }
      catch (error: unknown) { next(error); }
    });
    router.post("/bookings/:id/reschedule", async (request,response,next)=>{
      try { const actor = await this.actor(request); const body = this.object(request.body as unknown,["startAt","endAt","revision"]);
        response.json({booking:await this.operations.rescheduleBooking.execute(new RescheduleBookingAC(actor,request.params.id!,this.text(body.startAt),this.text(body.endAt),this.integer(body.revision)))});
      } catch(error:unknown) { next(error); }
    });
    router.post("/bookings/:id/cancel", async (request, response, next) => {
      try { const actor = await this.actor(request); this.object(request.body as unknown, []);
        response.json({ booking: await this.operations.cancelBooking.execute(new CancelBookingAC(actor, request.params.id!)) });
      } catch (error: unknown) { next(error); }
    });
    router.get("/resources/:id/bookings", async (request, response, next) => {
      try {
        const actor = await this.actor(request); this.query(request, ["startAt", "endAt", "page"]);
        response.json(await this.operations.history.execute(new ListBookingsForResourceAQ(actor, request.params.id!, this.text(request.query.startAt), this.text(request.query.endAt), this.page(request.query.page))));
      } catch (error: unknown) { next(error); }
    });
    router.get("/bookings/:id/private-note", async (request, response, next) => {
      try { const actor = await this.actor(request); this.query(request, []);
        response.json({ note: await this.operations.getNote.execute(new GetPrivateNoteAQ(actor, request.params.id!)) });
      } catch (error: unknown) { next(error); }
    });
    router.post("/bookings/:id/private-note", async (request, response, next) => {
      try { const actor = await this.actor(request); const body = this.object(request.body as unknown, ["text", "revision"]);
        response.json({ note: await this.operations.saveNote.execute(new SavePrivateNoteAC(actor, request.params.id!, this.text(body.text), this.integer(body.revision))) });
      } catch (error: unknown) { next(error); }
    });
    router.post("/account/password",async(request,response,next)=>{
      try { const actor=await this.actor(request); this.passwordLimiter.consume(actor.id); const body=this.object(request.body as unknown,["currentPassword","newPassword"]);
        await this.operations.changePassword.execute(new ChangePasswordAC(actor,this.text(body.currentPassword),this.text(body.newPassword))); response.json({changed:true});
      } catch(error:unknown) { next(error); }
    });
    router.post("/account/sessions/revoke-others",async(request,response,next)=>{
      try { await this.actor(request);this.object(request.body as unknown,[]);response.json({revoked:await this.operations.revokeOthers.execute(new RevokeOtherSessionsAC(this.authentication.cookie(request)))}); } catch(error:unknown) { next(error); }
    });
    router.get("/admin/accounts",async(request,response,next)=>{
      try { const actor=await this.actor(request);this.query(request,["page","search"]);response.json(await this.operations.accounts.list(new ListAccountsAQ(actor,this.page(request.query.page),request.query.search===undefined?"":this.text(request.query.search)))); } catch(error:unknown) { next(error); }
    });
    router.post("/admin/accounts/:id/block",async(request,response,next)=>{
      try { const actor=await this.actor(request);const body=this.object(request.body as unknown,["blocked"]);if(typeof body.blocked!=="boolean")throw new InvalidRequestBodyException();response.json({account:await this.operations.accounts.setBlocked(new SetAccountBlockedAC(actor,request.params.id!,body.blocked))}); } catch(error:unknown) { next(error); }
    });
    router.get("/admin/service", async (request, response, next) => {
      try { const actor = await this.actor(request); this.query(request, []); response.json({ service: this.operations.licenseStatus.execute(actor) }); }
      catch (error: unknown) { next(error); }
    });
    return router;
  }
}
