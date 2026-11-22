import { BookingSelectionService } from "#ui-domain/Booking/Service/BookingSelectionService";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthenticationPage } from "#ui-entrypoint/components/AuthenticationPage";
import { SessionUC } from "#ui-application/Identity/UseCase/SessionUC";
import { SessionHttpGateway } from "#ui-infrastructure/Transport/SessionHttpGateway";
import { RegisterUserUC } from "#ui-application/Identity/UseCase/RegisterUserUC";
import { RegistrationInputService } from "#ui-domain/Identity/Service/RegistrationInputService";
import { RegistrationHttpGateway } from "#ui-infrastructure/Transport/RegistrationHttpGateway";
import { WorkspaceUC } from "#ui-application/Booking/UseCase/WorkspaceUC";
import { WorkspaceHttpGateway } from "#ui-infrastructure/Transport/WorkspaceHttpGateway";
import "#ui-entrypoint/styles.css";

const root = document.getElementById("root");
if (root) {
  const registration = new RegisterUserUC(
    new RegistrationInputService(),
    new RegistrationHttpGateway(import.meta.env.VITE_API_BASE_URL || ""),
  );
  const session = new SessionUC(new SessionHttpGateway(import.meta.env.VITE_API_BASE_URL || ""));
  const workspace = new WorkspaceUC(new WorkspaceHttpGateway(import.meta.env.VITE_API_BASE_URL || ""), new BookingSelectionService());
  createRoot(root).render(<StrictMode><AuthenticationPage registration={registration} session={session} workspace={workspace} /></StrictMode>);
}
