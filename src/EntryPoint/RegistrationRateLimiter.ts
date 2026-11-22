import { RateLimitExceededException } from "#domain/SharedKernel/Exception/RateLimitExceededException";

/** Bounded local registration-attempt window keyed by the direct client address. */
export class RegistrationRateLimiter {
  private readonly entries = new Map<string, { attempts: number; expiresAt: number }>();

  /**
   * Defines the resource protection applied before parsing and hashing.
   * @param attempts - Maximum attempts per direct client address and window.
   * @param windowMs - Window duration in milliseconds.
   * @param maxClients - Maximum simultaneously tracked client addresses.
   */
  public constructor(
    private readonly attempts = 5,
    private readonly windowMs = 15 * 60 * 1000,
    private readonly maxClients = 5000,
  ) {}

  /**
   * Accounts for every registration attempt, including rejected input.
   * @param client - Direct socket address; forwarded headers are not trusted.
   * @param nowMs - Current timestamp, injectable for deterministic tests.
   * @throws RateLimitExceededException If the address or tracking capacity is exhausted.
   */
  public consume(client: string, nowMs: number = Date.now()): void {
    const previous = this.entries.get(client);
    if (previous && previous.expiresAt > nowMs) {
      if (previous.attempts >= this.attempts) throw new RateLimitExceededException();
      previous.attempts += 1;
      return;
    }
    if (!previous && this.entries.size >= this.maxClients) {
      for (const [key, entry] of this.entries) {
        if (entry.expiresAt <= nowMs) this.entries.delete(key);
      }
      if (this.entries.size >= this.maxClients) throw new RateLimitExceededException();
    }
    this.entries.set(client, { attempts: 1, expiresAt: nowMs + this.windowMs });
  }
}
