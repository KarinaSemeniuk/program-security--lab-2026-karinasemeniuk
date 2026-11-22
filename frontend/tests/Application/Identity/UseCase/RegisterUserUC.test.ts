import { RegisterUserUC } from "#ui-application/Identity/UseCase/RegisterUserUC";
import { RegisterUserAC } from "#ui-application/Identity/Command/RegisterUserAC";
import { RegistrationInputService } from "#ui-domain/Identity/Service/RegistrationInputService";
import { IRegistrationGateway } from "#ui-domain/Identity/OutsourceContract/IRegistrationGateway";

describe("frontend.application", () => {
  describe("identity.application.use-case", () => {
    describe("RegisterUserUC", () => {
      const register = jest.fn<ReturnType<IRegistrationGateway["register"]>, Parameters<IRegistrationGateway["register"]>>();
      const useCase = new RegisterUserUC(new RegistrationInputService(), { register });
      beforeEach(() => register.mockReset());
      it("prevents a request when local feedback rejects input", async () => {
        const result = await useCase.execute(new RegisterUserAC("invalid", "short", ""));
        expect(result.status).toBe("invalid");
        expect(register).not.toHaveBeenCalled();
      });
      it("sends normalized email and the exact password without confirmation or role", async () => {
        register.mockResolvedValue({ status: "failed", reason: "network", message: "controlled" });
        await useCase.execute(new RegisterUserAC(" USER@Example.TEST ", " cedar river fo", " cedar river fo"));
        expect(register).toHaveBeenCalledWith({ email: "user@example.test", password: " cedar river fo" });
      });
      it("preserves a controlled backend outcome", async () => {
        const outcome = { status: "failed", reason: "conflict", message: "controlled" } as const;
        register.mockResolvedValue(outcome);
        await expect(useCase.execute(new RegisterUserAC("user@example.test", "cedar river fog", "cedar river fog")))
          .resolves.toBe(outcome);
      });
    });
  });
});
