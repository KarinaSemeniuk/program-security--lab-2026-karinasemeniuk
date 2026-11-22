import { IAccountManagementRepository } from "#domain/Identity/OutsourceContract/IAccountManagementRepository";
import { ManagedAccount } from "#domain/Identity/Contract/ManagedAccount";
import { ManageAccountDPolicy } from "#domain/Identity/Policy/ManageAccountDPolicy";
import { AccountNotFoundException } from "#domain/Identity/Exception/AccountNotFoundException";
import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { Prisma, PrismaClient } from "@prisma/client";
import { IUserRepository } from "#domain/Identity/OutsourceContract/IUserRepository";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { User } from "#domain/Identity/Entity/User";
import { EmailAlreadyRegisteredException } from "#domain/Identity/Exception/EmailAlreadyRegisteredException";
import { DatabaseConnectionException } from "#infrastructure/Exception/DatabaseConnectionException";
import { UserPersistenceReadException } from "#infrastructure/Exception/UserPersistenceReadException";
import { UserPersistenceWriteException } from "#infrastructure/Exception/UserPersistenceWriteException";

import { IAuthenticationRepository } from "#domain/Identity/OutsourceContract/IAuthenticationRepository";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { UserRoleVO } from "#domain/Identity/ValueObject/UserRoleVO";
import { UserRole } from "#domain/Identity/Enum/UserRole";

/** PostgreSQL account persistence; Prisma types remain inside Infrastructure. */
export class PrismaUserRepository implements IUserRepository, IAuthenticationRepository, IAccountManagementRepository {
  private readonly client: PrismaClient;

  /**
   * Configures persistence for the selected application database.
   * @param databaseUrl - Local secret connection URL, never logged.
   * @throws DatabaseConnectionException If the client cannot be configured.
   */
  public constructor(databaseUrl: string) {
    try {
      this.client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    } catch {
      throw new DatabaseConnectionException();
    }
  }

  /**
   * Verifies persistence availability during application startup.
   * @returns Completion once the connection is available.
   * @throws DatabaseConnectionException If PostgreSQL is unavailable.
   */
  public async connect(): Promise<void> {
    try { await this.client.$connect(); } catch { throw new DatabaseConnectionException(); }
  }

  /**
   * Releases the application's persistence resources.
   * @returns Completion once connections are closed.
   * @throws DatabaseConnectionException If the client cannot disconnect.
   */
  public async disconnect(): Promise<void> {
    try { await this.client.$disconnect(); } catch { throw new DatabaseConnectionException(); }
  }

  /**
   * Checks the canonical email without loading credential data.
   * @param email - Validated normalized address.
   * @returns Whether the email is already registered.
   * @throws UserPersistenceReadException If the query fails.
   */
  public async existsByEmail(email: EmailVO): Promise<boolean> {
    try {
      return await this.client.userModel.findUnique({
        where: { email: email.getValue() }, select: { id: true },
      }) !== null;
    } catch { throw new UserPersistenceReadException(); }
  }

  /** @param email - Canonical address. @returns Account or absence. @throws UserPersistenceReadException If loading fails. */
  public findByEmail(email: string): Promise<User | undefined> { return this.load({ email }); }
  /** @param id - UUID. @returns Account or absence. @throws UserPersistenceReadException If loading fails. */
  public findById(id: string): Promise<User | undefined> { return this.load({ id }); }
  private async load(where: Prisma.UserModelWhereUniqueInput): Promise<User | undefined> {
    try {
      const row = await this.client.userModel.findUnique({ where });
      return row ? User.restore(new UserIdVO(row.id), new EmailVO(row.email), new PasswordHashVO(row.passwordHash),
        new UserRoleVO(row.role as UserRole), row.isBlocked, row.createdAt) : undefined;
    } catch { throw new UserPersistenceReadException(); }
  }

  /** @param id - UUID. @param oldHash - Verified snapshot. @param newHash - Valid replacement. @returns Atomic success and all-session revocation. @throws UserPersistenceWriteException On storage failure. */
  public async changePassword(id:string,oldHash:string,newHash:string):Promise<boolean> {
    try { return await this.client.$transaction(async tx=>{
      const changed=await tx.userModel.updateMany({where:{id,passwordHash:oldHash,isBlocked:false},data:{passwordHash:newHash}});
      if(changed.count!==1)return false;
      await tx.sessionModel.deleteMany({where:{userId:id}}); return true;
    }); } catch { throw new UserPersistenceWriteException(); }
  }
  /** @param id - UUID. @param keep - Current session UUID. @returns Revoked session count. @throws UserPersistenceWriteException On storage failure. */
  public async revokeOthers(id:string,keep:string):Promise<number> {
    try { return (await this.client.sessionModel.deleteMany({where:{userId:id,id:{not:keep}}})).count; } catch { throw new UserPersistenceWriteException(); }
  }
  private account(row:{id:string;email:string;role:"USER"|"ADMIN";isBlocked:boolean;createdAt:Date}):ManagedAccount { return {id:row.id,email:row.email,role:row.role,isBlocked:row.isBlocked,createdAt:row.createdAt.toISOString()}; }
  /** @param page - Zero-based page. @param search - Email substring. @returns Safe Admin projection. @throws UserPersistenceReadException On storage failure. */
  public async accounts(page:number,search:string):Promise<{accounts:ManagedAccount[];total:number}> {
    try { const where={email:{contains:search,mode:"insensitive" as const}};
      const [rows,total]=await this.client.$transaction([this.client.userModel.findMany({where,orderBy:[{createdAt:"desc"},{id:"asc"}],take:50,skip:page*50,select:{id:true,email:true,role:true,isBlocked:true,createdAt:true}}),this.client.userModel.count({where})]);
      return {accounts:rows.map(row=>this.account(row)),total};
    } catch { throw new UserPersistenceReadException(); }
  }
  /** @param actorId - Admin. @param id - Target. @param blocked - Desired state. @returns Safe updated account. @throws ARoomBookException On denied/missing/storage failure. */
  public async setBlocked(actorId:string,id:string,blocked:boolean):Promise<ManagedAccount> {
    try { return await this.client.$transaction(async tx=>{
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${id}::uuid FOR UPDATE`;
      const row=await tx.userModel.findUnique({where:{id}}); if(!row)throw new AccountNotFoundException();
      new ManageAccountDPolicy().assertTarget(actorId,id,row.role);
      const changed=await tx.userModel.update({where:{id},data:{isBlocked:blocked},select:{id:true,email:true,role:true,isBlocked:true,createdAt:true}});
      if(blocked)await tx.sessionModel.deleteMany({where:{userId:id}});
      return this.account(changed);
    }); } catch(error:unknown) { if(error instanceof ARoomBookException)throw error; throw new UserPersistenceWriteException(); }
  }
  /**
   * Stores a complete newly registered account.
   * @param user - Aggregate whose invariants have already been enforced.
   * @throws EmailAlreadyRegisteredException If the unique email index rejects a race.
   * @throws UserPersistenceWriteException If another persistence failure occurs.
   */
  public async save(user: User): Promise<void> {
    try {
      await this.client.userModel.create({
        data: {
          id: user.getId().getValue(), email: user.getEmail().getValue(),
          passwordHash: user.getPasswordHash().getValue(), role: user.getRole().getValue(),
          isBlocked: user.isBlocked(), createdAt: user.getCreatedAt(),
        },
        select: { id: true },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const target = error.meta?.target;
        if (target === "users_email_key" || (Array.isArray(target) && target.length === 1 && target[0] === "email")) {
          throw new EmailAlreadyRegisteredException();
        }
      }
      throw new UserPersistenceWriteException();
    }
  }
}
