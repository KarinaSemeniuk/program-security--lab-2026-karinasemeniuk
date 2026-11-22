import { InvalidConfigurationException } from "#domain/SharedKernel/Exception/InvalidConfigurationException";

/** Validated configuration required to expose the registration API. */
export class RegistrationConfiguration {
  /** Secret PostgreSQL URL consumed only by the persistence adapter. */
  public readonly databaseUrl: string;
  /** Valid local API listening port. */
  public readonly port: number;
  /** Single trusted frontend origin for browser requests. */
  public readonly corsOrigin: string;
  /** Local blocklist path read during startup. */
  public readonly blocklistPath: string;

  /**
   * Reads and validates configuration before opening the HTTP listener.
   * @param environment - Runtime environment supplied by bootstrap.
   * @throws InvalidConfigurationException If required values are invalid.
   */
  public constructor(environment: NodeJS.ProcessEnv) {
    try {
      const databaseUrl = environment.DATABASE_URL;
      const port = Number(environment.PORT?.trim() || "3000");
      const origin = environment.CORS_ORIGIN?.trim() || "http://127.0.0.1:5173";
      const blocklistPath = environment.PASSWORD_BLOCKLIST_PATH?.trim() || "data/password-blocklist.json";
      if (!databaseUrl || !Number.isInteger(port) || port < 1 || port > 65535 || !blocklistPath) {
        throw new InvalidConfigurationException();
      }
      const database = new URL(databaseUrl);
      const frontend = new URL(origin);
      if (!["postgres:", "postgresql:"].includes(database.protocol) || !database.username ||
          !database.password || database.pathname.length < 2 ||
          /(?:YOUR_PASSWORD|changeme|placeholder)/i.test(decodeURIComponent(database.password)) ||
          !["http:", "https:"].includes(frontend.protocol) || frontend.origin !== origin ||
          frontend.username || frontend.password) {
        throw new InvalidConfigurationException();
      }
      this.databaseUrl = databaseUrl;
      this.port = port;
      this.corsOrigin = origin;
      this.blocklistPath = blocklistPath;
    } catch { throw new InvalidConfigurationException(); }
  }
}
