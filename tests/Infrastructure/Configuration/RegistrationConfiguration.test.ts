import { RegistrationConfiguration } from "#infrastructure/Configuration/RegistrationConfiguration";
import { InvalidConfigurationException } from "#domain/SharedKernel/Exception/InvalidConfigurationException";

describe("infrastructure", () => {
  describe("configuration.infrastructure", () => {
    describe("RegistrationConfiguration", () => {
      // Synthetic configuration values; this test never opens a connection.
      const database = "postgresql://unit_user:unit_only@127.0.0.1/unit_test";
      it("uses safe local defaults for optional configuration", () => {
        const config = new RegistrationConfiguration({ DATABASE_URL: database });
        expect(config.databaseUrl).toBe(database);
        expect(config.port).toBe(3000);
        expect(config.corsOrigin).toBe("http://127.0.0.1:5173");
        expect(config.blocklistPath).toBe("data/password-blocklist.json");
      });
      it("uses defaults for optional names left blank in the example file", () => {
        const config = new RegistrationConfiguration({
          DATABASE_URL: database, PORT: "", CORS_ORIGIN: "", PASSWORD_BLOCKLIST_PATH: "",
        });
        expect(config.port).toBe(3000);
        expect(config.corsOrigin).toBe("http://127.0.0.1:5173");
      });
      it("accepts explicitly configured local values", () => {
        const config = new RegistrationConfiguration({
          DATABASE_URL: database, PORT: "3001", CORS_ORIGIN: "http://localhost:5173",
          PASSWORD_BLOCKLIST_PATH: "data/custom.json",
        });
        expect(config.port).toBe(3001);
        expect(config.corsOrigin).toBe("http://localhost:5173");
        expect(config.blocklistPath).toBe("data/custom.json");
      });
      it.each([
        {}, { DATABASE_URL: "invalid" }, { DATABASE_URL: "https://example.test/" },
        { DATABASE_URL: "postgresql://unit_user@127.0.0.1/unit_test" },
        { DATABASE_URL: "postgresql://unit_user:changeme@127.0.0.1/unit_test" },
        { DATABASE_URL: database, PORT: "0" },
        { DATABASE_URL: database, PORT: "65536" },
        { DATABASE_URL: database, PORT: "1.5" },
        { DATABASE_URL: database, CORS_ORIGIN: "*" },
        { DATABASE_URL: database, CORS_ORIGIN: "http://localhost:5173/" },
        { DATABASE_URL: database, CORS_ORIGIN: "http://name:secret@example.test" },
      ])("rejects invalid or placeholder configuration", (environment) => {
        expect(() => new RegistrationConfiguration(environment)).toThrow(InvalidConfigurationException);
      });
    });
  });
});
