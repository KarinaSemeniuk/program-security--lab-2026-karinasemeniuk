import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaUserRepository } from "#infrastructure/Persistence/PrismaUserRepository";
import { User } from "#domain/Identity/Entity/User";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { EmailAlreadyRegisteredException } from "#domain/Identity/Exception/EmailAlreadyRegisteredException";
import { DatabaseConnectionException } from "#infrastructure/Exception/DatabaseConnectionException";
import { UserPersistenceReadException } from "#infrastructure/Exception/UserPersistenceReadException";
import { UserPersistenceWriteException } from "#infrastructure/Exception/UserPersistenceWriteException";

jest.mock("@prisma/client", () => ({
  ...jest.requireActual<typeof import("@prisma/client")>("@prisma/client"),
  PrismaClient: jest.fn(),
}));

describe("infrastructure", () => {
  describe("persistence.infrastructure", () => {
    describe("PrismaUserRepository", () => {
      const client = {
        $connect: jest.fn<Promise<void>, []>(),
        $disconnect: jest.fn<Promise<void>, []>(),
        userModel: {
          findUnique: jest.fn<Promise<{ id: string } | null>, [unknown]>(),
          create: jest.fn<Promise<{ id: string }>, [unknown]>(),
        },
      };
      let users: PrismaUserRepository;
      const email = new EmailVO("user@example.test");
      const user = User.register(
        new UserIdVO("11111111-1111-4111-8111-111111111111"), email,
        new PasswordHashVO("$2b$12$" + "a".repeat(53)), new Date("2026-10-30T00:00:00Z"),
      );
      beforeEach(() => {
        client.$connect.mockReset().mockResolvedValue(undefined);
        client.$disconnect.mockReset().mockResolvedValue(undefined);
        client.userModel.findUnique.mockReset().mockResolvedValue(null);
        client.userModel.create.mockReset().mockResolvedValue({ id: user.getId().getValue() });
        // The module replacement exposes only methods exercised by this adapter.
        jest.mocked(PrismaClient).mockImplementation(() => client as unknown as PrismaClient);
        users = new PrismaUserRepository("postgresql://unit_user@127.0.0.1/unit_test");
      });
      it("connects and disconnects through the mocked client", async () => {
        await users.connect();
        await users.disconnect();
        expect(client.$connect).toHaveBeenCalledTimes(1);
        expect(client.$disconnect).toHaveBeenCalledTimes(1);
      });
      it("wraps connection failures", async () => {
        client.$connect.mockRejectedValue(new Error("private database error"));
        await expect(users.connect()).rejects.toThrow(DatabaseConnectionException);
      });
      it("wraps disconnect failures", async () => {
        client.$disconnect.mockRejectedValue(new Error("private database error"));
        await expect(users.disconnect()).rejects.toThrow(DatabaseConnectionException);
      });
      it("queries only the id for normalized-email availability", async () => {
        await expect(users.existsByEmail(email)).resolves.toBe(false);
        expect(client.userModel.findUnique).toHaveBeenCalledWith({
          where: { email: "user@example.test" }, select: { id: true },
        });
        client.userModel.findUnique.mockResolvedValue({ id: user.getId().getValue() });
        await expect(users.existsByEmail(email)).resolves.toBe(true);
      });
      it("wraps query failures", async () => {
        client.userModel.findUnique.mockRejectedValue(new Error("private query detail"));
        await expect(users.existsByEmail(email)).rejects.toThrow(UserPersistenceReadException);
      });
      it("persists only server-assigned aggregate values", async () => {
        await users.save(user);
        expect(client.userModel.create).toHaveBeenCalledWith({
          data: {
            id: user.getId().getValue(), email: "user@example.test",
            passwordHash: user.getPasswordHash().getValue(), role: "USER",
            isBlocked: false, createdAt: new Date("2026-10-30T00:00:00Z"),
          },
          select: { id: true },
        });
      });
      it("maps the unique email constraint race to a domain conflict", async () => {
        client.userModel.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
          "private index detail", { code: "P2002", clientVersion: "5.20.0", meta: { target: ["email"] } },
        ));
        await expect(users.save(user)).rejects.toThrow(EmailAlreadyRegisteredException);
      });
      it("does not misclassify a different unique constraint as an email conflict", async () => {
        client.userModel.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError(
          "private index detail", { code: "P2002", clientVersion: "5.20.0", meta: { target: ["id"] } },
        ));
        await expect(users.save(user)).rejects.toThrow(UserPersistenceWriteException);
      });
      it("wraps other write failures", async () => {
        client.userModel.create.mockRejectedValue(new Error("private write detail"));
        await expect(users.save(user)).rejects.toThrow(UserPersistenceWriteException);
      });
    });
  });
});
