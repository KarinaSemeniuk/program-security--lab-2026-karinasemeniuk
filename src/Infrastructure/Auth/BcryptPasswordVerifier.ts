import bcrypt from "bcrypt";
import { IPasswordVerifier } from "#domain/Identity/OutsourceContract/IPasswordVerifier";
import { PasswordHashingException } from "#infrastructure/Exception/PasswordHashingException";
/** Bcrypt verification with a process-local dummy hash of equal cost. */
export class BcryptPasswordVerifier implements IPasswordVerifier {
  private constructor(private readonly dummyHash: string) {}
  /** @returns Ready comparison adapter. @throws PasswordHashingException On initialization failure. */
  public static async create(): Promise<BcryptPasswordVerifier> {
    try { return new BcryptPasswordVerifier(await bcrypt.hash("RoomBook dummy credential", 12)); }
    catch { throw new PasswordHashingException(); }
  }
  /** @param password - Exact submitted password. @param hash - Stored hash or empty. @returns Match result. @throws PasswordHashingException On bcrypt failure. */
  public async verify(password: string, hash: string): Promise<boolean> {
    try { return await bcrypt.compare(password, hash || this.dummyHash); }
    catch { throw new PasswordHashingException(); }
  }
}
