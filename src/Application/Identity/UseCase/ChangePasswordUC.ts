import { ChangePasswordAC } from "#application/Identity/Command/ChangePasswordAC";
import { AuthenticateUserService } from "#domain/Identity/Service/AuthenticateUserService";
import { ChangePasswordService } from "#domain/Identity/Service/ChangePasswordService";
import { IAccountManagementRepository } from "#domain/Identity/OutsourceContract/IAccountManagementRepository";
import { InvalidCredentialsException } from "#domain/Identity/Exception/InvalidCredentialsException";
import { InvalidCurrentPasswordException } from "#domain/Identity/Exception/InvalidCurrentPasswordException";
import { AccountConflictException } from "#domain/Identity/Exception/AccountConflictException";
/** Verifies current credential and atomically replaces/revokes, rejecting concurrent replacements. */
export class ChangePasswordUC {
  /** @param authentication - Exact current credential verification. @param passwords - Existing replacement policy. @param accounts - Atomic write/revocation. */
  public constructor(private readonly authentication:AuthenticateUserService,private readonly passwords:ChangePasswordService,private readonly accounts:IAccountManagementRepository) {}
  /** @param command - Session-derived request. @throws ARoomBookException On current/policy/conflict/storage failure. */
  public async execute(command:ChangePasswordAC):Promise<void> {
    let user;
    try { user=await this.authentication.authenticate(command.actor.email,command.currentPassword); }
    catch(error:unknown) { if(error instanceof InvalidCredentialsException)throw new InvalidCurrentPasswordException(); throw error; }
    if(user.getId().getValue()!==command.actor.id)throw new InvalidCurrentPasswordException();
    const hash=await this.passwords.protect(command.newPassword);
    if(!await this.accounts.changePassword(command.actor.id,user.getPasswordHash().getValue(),hash.getValue()))throw new AccountConflictException();
  }
}
