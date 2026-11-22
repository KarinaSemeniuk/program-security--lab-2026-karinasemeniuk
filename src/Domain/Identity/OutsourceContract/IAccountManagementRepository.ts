import { ManagedAccount } from "#domain/Identity/Contract/ManagedAccount";
/** Atomic credential/session and guarded account administration. */
export interface IAccountManagementRepository {
  /** @param id - Account UUID. @param oldHash - Verified credential snapshot. @param newHash - Valid bcrypt hash. @returns Whether atomic replacement succeeded; success revokes every session. @throws ARoomBookException On storage failure. */
  changePassword(id:string,oldHash:string,newHash:string):Promise<boolean>;
  /** @param id - Account UUID. @param keep - Current verified session UUID. @returns Number revoked. @throws ARoomBookException On storage failure. */
  revokeOthers(id:string,keep:string):Promise<number>;
  /** @param page - Bounded page. @param search - Bounded email search. @returns Safe Admin account page. @throws ARoomBookException On storage failure. */
  accounts(page:number,search:string):Promise<{accounts:ManagedAccount[];total:number}>;
  /** @param actorId - Admin identity. @param id - Target UUID. @param blocked - Desired state. @returns Safe account projection. @throws ARoomBookException On denied/missing/storage failure. */
  setBlocked(actorId:string,id:string,blocked:boolean):Promise<ManagedAccount>;
}
