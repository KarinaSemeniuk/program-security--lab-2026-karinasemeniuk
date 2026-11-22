import { RegistrationController } from "#entrypoint/RegistrationController";
import { RegisterUserAC } from "#application/Identity/Command/RegisterUserAC";
import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";

describe("entry-point", () => {
  describe("RegistrationController", () => {
    const execute = jest.fn<Promise<UserDTO>, [RegisterUserAC]>();
    const controller = new RegistrationController({ execute });
    beforeEach(() => { execute.mockClear(); });
    it("forwards exactly the submitted credential strings", async () => {
      await controller.register({ email: " USER@example.test ", password: " cedar river fo" });
      expect(execute).toHaveBeenCalledWith(new RegisterUserAC(" USER@example.test ", " cedar river fo"));
    });
    it.each([null, [], "text", 1, {}, { email: "user@example.test" },
      { email: 42, password: "cedar river fog" },
      { email: "user@example.test", password: 42 },
      { email: "user@example.test", password: "cedar river fog", role: "ADMIN" },
      { email: "user@example.test", password: "cedar river fog", id: "chosen-id" },
    ])("rejects malformed fields and privilege injection", async (body) => {
      await expect(controller.register(body)).rejects.toThrow(InvalidRequestBodyException);
      expect(execute).not.toHaveBeenCalled();
    });
  });
});
