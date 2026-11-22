import { InvalidConfigurationException } from "#domain/SharedKernel/Exception/InvalidConfigurationException";
/** Authentication settings validated before opening a listener. */
export class AuthenticationConfiguration {
  /** Secret signing material; never log or serialize configuration. */
  public readonly secret: string;
  /** Secure cookie flag, disabled only for explicit loopback HTTP development. */
  public readonly secure: boolean;
  /** @param environment - Private runtime configuration. @param origin - Validated frontend origin. @throws InvalidConfigurationException For unsafe settings. */
  public constructor(environment: NodeJS.ProcessEnv, origin: string) {
    const secret = environment.JWT_SECRET ?? "";
    const frontend = new URL(origin);
    if (!/^[a-f0-9]{64,}$/i.test(secret) || (environment.JWT_EXPIRES_IN && environment.JWT_EXPIRES_IN !== "900") ||
        (frontend.protocol === "http:" && (environment.NODE_ENV === "production" || !["127.0.0.1", "localhost", "[::1]"].includes(frontend.hostname)))) {
      throw new InvalidConfigurationException();
    }
    this.secret = secret;
    this.secure = frontend.protocol === "https:";
  }
}
