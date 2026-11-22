import { ChangePasswordUC } from "#application/Identity/UseCase/ChangePasswordUC";
import { ManageAccountsUC } from "#application/Identity/UseCase/ManageAccountsUC";
import { RevokeOtherSessionsUC } from "#application/Identity/UseCase/RevokeOtherSessionsUC";
import { ChangePasswordService } from "#domain/Identity/Service/ChangePasswordService";
import { RescheduleBookingUC } from "#application/Booking/UseCase/RescheduleBookingUC";
import { LicensedRescheduleBookingUC } from "#application/BookingLicensing/UseCase/LicensedRescheduleBookingUC";
import { SetResourceCalendarUC } from "#application/Catalog/UseCase/SetResourceCalendarUC";
import { LicensedSetResourceCalendarUC } from "#application/CatalogLicensing/UseCase/LicensedSetResourceCalendarUC";
import { SealedNotesUC } from "#application/Booking/UseCase/SealedNotesUC";
import { HttpServer } from "#entrypoint/HttpServer";
import { HttpTelemetry } from "#infrastructure/Transport/HttpTelemetry";
import { FileHashChain } from "#infrastructure/Audit/FileHashChain";
import { RegistrationController } from "#entrypoint/RegistrationController";
import { HttpErrorResponder } from "#entrypoint/HttpErrorResponder";
import { RegisterUserUC } from "#application/Identity/UseCase/RegisterUserUC";
import { RegisterUserService } from "#domain/Identity/Service/RegisterUserService";
import { PasswordPolicyService } from "#domain/Identity/Service/PasswordPolicyService";
import { BcryptPasswordHasher } from "#infrastructure/Auth/BcryptPasswordHasher";
import { UuidUserIdFactory } from "#infrastructure/Auth/UuidUserIdFactory";
import { PrismaUserRepository } from "#infrastructure/Persistence/PrismaUserRepository";
import { RegistrationConfiguration } from "#infrastructure/Configuration/RegistrationConfiguration";
import { LocalPasswordBlocklist } from "#infrastructure/Configuration/LocalPasswordBlocklist";

import { AuthenticationController } from "#entrypoint/AuthenticationController";
import { AuthenticationConfiguration } from "#infrastructure/Configuration/AuthenticationConfiguration";
import { JwtTokenService } from "#infrastructure/Auth/JwtTokenService";
import { BcryptPasswordVerifier } from "#infrastructure/Auth/BcryptPasswordVerifier";
import { PrismaSessionRepository } from "#infrastructure/Persistence/PrismaSessionRepository";
import { AuthenticateUserService } from "#domain/Identity/Service/AuthenticateUserService";
import { SignInUserUC } from "#application/Identity/UseCase/SignInUserUC";
import { GetCurrentUserUC } from "#application/Identity/UseCase/GetCurrentUserUC";
import { SignOutUserUC } from "#application/Identity/UseCase/SignOutUserUC";

import { WorkspacePersistence } from "#infrastructure/Persistence/WorkspacePersistence";
import { CompleteBookingService } from "#domain/Booking/Service/CompleteBookingService";
import { WorkspaceController } from "#entrypoint/WorkspaceController";
import { BookingIdFactory } from "#infrastructure/Auth/BookingIdFactory";
import { BookingEventDispatcher } from "#infrastructure/Event/BookingEventDispatcher";
import { CreateBookingService } from "#domain/Booking/Service/CreateBookingService";
import { UpdateResourceUC } from "#application/Catalog/UseCase/UpdateResourceUC";
import { UpdateResourceAC } from "#application/Catalog/Command/UpdateResourceAC";
import { ReactivateResourceUC } from "#application/Catalog/UseCase/ReactivateResourceUC";
import { ReactivateResourceAC } from "#application/Catalog/Command/ReactivateResourceAC";
import { GetResourceDetailsUC } from "#application/Catalog/UseCase/GetResourceDetailsUC";
import { GetResourceDetailsAQ } from "#application/Catalog/Query/GetResourceDetailsAQ";
import { LicensedUpdateResourceUC } from "#application/CatalogLicensing/UseCase/LicensedUpdateResourceUC";
import { LicensedReactivateResourceUC } from "#application/CatalogLicensing/UseCase/LicensedReactivateResourceUC";
import { CreateResourceUC } from "#application/Catalog/UseCase/CreateResourceUC";
import { DeactivateResourceUC } from "#application/Catalog/UseCase/DeactivateResourceUC";
import { ListActiveResourcesUC } from "#application/Catalog/UseCase/ListActiveResourcesUC";
import { ListAllResourcesUC } from "#application/Catalog/UseCase/ListAllResourcesUC";
import { CreateBookingUC } from "#application/BookingCatalog/UseCase/CreateBookingUC";
import { CancelBookingUC } from "#application/Booking/UseCase/CancelBookingUC";
import { ListMyBookingsUC } from "#application/Booking/UseCase/ListMyBookingsUC";
import { ListBookingsForResourceUC } from "#application/BookingCatalog/UseCase/ListBookingsForResourceUC";
import { GetResourceAvailabilityUC } from "#application/BookingCatalog/UseCase/GetResourceAvailabilityUC";

import { FileNoteKeyring } from "#infrastructure/Configuration/FileNoteKeyring";
import { AesGcmNoteCipher } from "#infrastructure/Cryptography/AesGcmNoteCipher";
import { GetPrivateNoteUC } from "#application/Booking/UseCase/GetPrivateNoteUC";
import { SavePrivateNoteUC } from "#application/Booking/UseCase/SavePrivateNoteUC";

import { FileInstallationLicense } from "#infrastructure/Licensing/FileInstallationLicense";
import { LicensedCreateBookingUC } from "#application/BookingCatalogLicensing/UseCase/LicensedCreateBookingUC";
import { LicensedCreateResourceUC } from "#application/CatalogLicensing/UseCase/LicensedCreateResourceUC";
import { LicensedSavePrivateNoteUC } from "#application/BookingLicensing/UseCase/LicensedSavePrivateNoteUC";
import { GetServiceLicenseUC } from "#application/CatalogLicensing/UseCase/GetServiceLicenseUC";

async function start(): Promise<void> {
  const config = new RegistrationConfiguration(process.env);
  const authConfig = new AuthenticationConfiguration(process.env, config.corsOrigin);
  const tokens = new JwtTokenService(authConfig.secret);
  const blocklist = new LocalPasswordBlocklist().load(config.blocklistPath);
  const users = new PrismaUserRepository(config.databaseUrl);
  const sessions = new PrismaSessionRepository(config.databaseUrl);
  const license = new FileInstallationLicense(process.env.LICENSE_PATH || "data/installation-license.json", process.env.LICENSE_PUBLIC_KEY_PATH || "data/license-public.pem", process.env.ROOMBOOK_INSTALLATION_ID || "");
  const noteKeys = new FileNoteKeyring(process.env.NOTE_KEYRING_PATH || ".secrets/note-keys.json");
  noteKeys.load();
  const noteCipher = new AesGcmNoteCipher(() => noteKeys.load());
  const bookingIds = new BookingIdFactory();
  const persistence = new WorkspacePersistence(config.databaseUrl, bookingIds, new BookingEventDispatcher(), noteCipher);
  let scheduler: ReturnType<typeof setInterval> | undefined;
  let server: HttpServer | null = null;
  try {
    await users.connect();
    const registration = new RegisterUserService(
      users, new BcryptPasswordHasher(), new UuidUserIdFactory(),
      new PasswordPolicyService(blocklist),
    );
    const authentication = new AuthenticationController(
      new SignInUserUC(new AuthenticateUserService(users, await BcryptPasswordVerifier.create()), tokens, sessions),
      new GetCurrentUserUC(users, tokens, sessions), new SignOutUserUC(tokens, sessions), config.corsOrigin, authConfig.secure,
    );
    await persistence.connect();
    const { resources, bookings } = persistence;
    const completion = new CompleteBookingService(bookings);
    const workspace = new WorkspaceController(new GetCurrentUserUC(users, tokens, sessions), authentication, config.corsOrigin, {
      sealedNotes: new SealedNotesUC(persistence.sealedNotes),
      changePassword: new ChangePasswordUC(new AuthenticateUserService(users,await BcryptPasswordVerifier.create()),new ChangePasswordService(new PasswordPolicyService(blocklist),new BcryptPasswordHasher()),users),
      accounts: new ManageAccountsUC(users), revokeOthers: new RevokeOtherSessionsUC(users,tokens),
      getNote: new GetPrivateNoteUC(persistence.notes), saveNote: new LicensedSavePrivateNoteUC(new SavePrivateNoteUC(persistence.notes), license),
      licenseStatus: new GetServiceLicenseUC(license),
      setCalendar: new LicensedSetResourceCalendarUC(new SetResourceCalendarUC(persistence.calendars), license),
      resourceDetails: new GetResourceDetailsUC(resources),
      updateResource: new LicensedUpdateResourceUC(new UpdateResourceUC(persistence.resourceManagement), license),
      reactivateResource: new LicensedReactivateResourceUC(new ReactivateResourceUC(persistence.resourceManagement), license),
      createResource: new LicensedCreateResourceUC(new CreateResourceUC(resources), license), deactivateResource: new DeactivateResourceUC(resources),
      activeResources: new ListActiveResourcesUC(resources), allResources: new ListAllResourcesUC(resources),
      createBooking: new LicensedCreateBookingUC(new CreateBookingUC(resources, bookings, new CreateBookingService(bookingIds)), license),
      rescheduleBooking: new LicensedRescheduleBookingUC(new RescheduleBookingUC(persistence.bookingManagement),license),
      cancelBooking: new CancelBookingUC(bookings), mine: new ListMyBookingsUC(bookings),
      history: new ListBookingsForResourceUC(bookings), availability: new GetResourceAvailabilityUC(resources, bookings),
    });
    const chain = new FileHashChain(process.env.AUDIT_CHAIN_PATH || "var/audit/events-chain.jsonl");
    const telemetry = new HttpTelemetry(process.env.AUDIT_LOG_PATH || "var/log/audit.jsonl", 5 * 1024 * 1024, 5, chain);
    server = new HttpServer(new RegistrationController(new RegisterUserUC(registration)), config.corsOrigin, undefined, authentication, workspace, telemetry.middleware());
    let completing = false;
    const complete = async (): Promise<void> => {
      if (completing) return; completing = true;
      try { await completion.complete(); }
      catch (error: unknown) { const safe = new HttpErrorResponder().normalize(error); console.error(safe.getCode() + ": " + safe.getPublicMessage()); }
      finally { completing = false; }
    };
    await complete();
    scheduler = setInterval(() => { void complete(); }, 60_000);
    scheduler.unref();
    await server.start(config.port);
    console.log("RoomBook API: http://127.0.0.1:" + config.port);
    let stopping = false;
    const shutdown = async (): Promise<void> => {
      if (stopping) return;
      stopping = true;
      if (scheduler) clearInterval(scheduler);
      try {
        await server?.close();
        await users.disconnect();
        await sessions.disconnect();
        await persistence.disconnect();
      } catch (error: unknown) {
        const safe = new HttpErrorResponder().normalize(error);
        console.error(safe.getCode() + ": " + safe.getPublicMessage());
        process.exitCode = 1;
      }
    };
    process.once("SIGINT", () => { void shutdown(); });
    process.once("SIGTERM", () => { void shutdown(); });
  } catch (error: unknown) {
    try { await server?.close(); } catch { /* Preserve the original startup failure. */ }
    try { await users.disconnect(); } catch { /* Preserve the original startup failure. */ }
    try { await sessions.disconnect(); } catch { /* Preserve original failure. */ }
    if (scheduler) clearInterval(scheduler);
    try { await persistence.disconnect(); } catch { /* Preserve original failure. */ }
    throw error;
  }
}

void start().catch((error: unknown) => {
  const safe = new HttpErrorResponder().normalize(error);
  console.error(safe.getCode() + ": " + safe.getPublicMessage());
  process.exitCode = 1;
});
