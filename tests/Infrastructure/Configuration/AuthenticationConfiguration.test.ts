import { AuthenticationConfiguration } from "#infrastructure/Configuration/AuthenticationConfiguration";
import { InvalidConfigurationException } from "#domain/SharedKernel/Exception/InvalidConfigurationException";
describe("AuthenticationConfiguration", () => {
  const environment = { JWT_SECRET: "ab".repeat(32) };
  it("allows non-Secure cookies only for local HTTP development", () => {
    expect(new AuthenticationConfiguration(environment, "http://127.0.0.1:5173").secure).toBe(false);
    expect(new AuthenticationConfiguration(environment, "https://roombook.example").secure).toBe(true);
  });
  it.each([{}, { JWT_SECRET: "weak" }, { ...environment, JWT_EXPIRES_IN: "3600" }, { ...environment, NODE_ENV: "production" }])("rejects unsafe settings", env => {
    expect(() => new AuthenticationConfiguration(env, "http://127.0.0.1:5173")).toThrow(InvalidConfigurationException);
  });
  it("rejects remote HTTP origins", () => {
    expect(() => new AuthenticationConfiguration(environment, "http://example.test")).toThrow(InvalidConfigurationException);
  });
});
