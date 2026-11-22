import { SetAccountBlockedAC } from "#application/Identity/Command/SetAccountBlockedAC";
import { ListAccountsAQ } from "#application/Identity/Query/ListAccountsAQ";
import { IAccountManagementRepository } from "#domain/Identity/OutsourceContract/IAccountManagementRepository";
import { AccountAccessDeniedException } from "#domain/Identity/Exception/AccountAccessDeniedException";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Admin directory and access-block coordination; role mutation is intentionally absent. */
export class ManageAccountsUC {
  /** @param accounts - Atomic account administration. */
  public constructor(private readonly accounts:IAccountManagementRepository) {}
  /** @param query - Current actor, search and page. @returns Safe account page. @throws ARoomBookException On denied/invalid/storage failure. */
  public list(query:ListAccountsAQ) { if(query.actor.role!=="ADMIN")throw new AccountAccessDeniedException(); if(!Number.isInteger(query.page)||query.page<0||query.page>10000||query.search.length>100)throw new InvalidRequestBodyException(); return this.accounts.accounts(query.page,query.search.trim()); }
  /** @param command - Current actor and target. @returns Safe updated account. @throws ARoomBookException On denied/invalid/storage failure. */
  public setBlocked(command:SetAccountBlockedAC) { if(command.actor.role!=="ADMIN")throw new AccountAccessDeniedException(); return this.accounts.setBlocked(command.actor.id,new UserIdVO(command.accountId).getValue(),command.blocked); }
}
