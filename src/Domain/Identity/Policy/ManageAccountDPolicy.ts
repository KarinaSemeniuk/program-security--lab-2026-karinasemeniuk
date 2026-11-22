import { AccountAccessDeniedException } from "#domain/Identity/Exception/AccountAccessDeniedException";
/** Prevents self-lockout and Admin-on-Admin denial; role promotion remains a local operation. */
export class ManageAccountDPolicy {
  /** @param actorId - Authenticated administrator. @param targetId - Selected account. @param targetRole - Locked current role. @throws AccountAccessDeniedException On self or administrative target. */
  public assertTarget(actorId:string,targetId:string,targetRole:string):void { if(actorId===targetId || targetRole!=="USER") throw new AccountAccessDeniedException(); }
}
