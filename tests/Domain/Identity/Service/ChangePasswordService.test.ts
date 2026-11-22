import { ChangePasswordService } from "#domain/Identity/Service/ChangePasswordService";
import { PasswordPolicyService } from "#domain/Identity/Service/PasswordPolicyService";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { PasswordTooShortException } from "#domain/Identity/Exception/PasswordTooShortException";
import { PasswordTooLongException } from "#domain/Identity/Exception/PasswordTooLongException";
import { PasswordBlocklistedException } from "#domain/Identity/Exception/PasswordBlocklistedException";
import { InvalidPasswordUnicodeException } from "#domain/Identity/Exception/InvalidPasswordUnicodeException";
import { ManageAccountDPolicy } from "#domain/Identity/Policy/ManageAccountDPolicy";
import { AccountAccessDeniedException } from "#domain/Identity/Exception/AccountAccessDeniedException";
describe("domain.identity.credential replacement",()=>{
 const hasher={hash:jest.fn()};const service=new ChangePasswordService(new PasswordPolicyService(new Set(["blocked password phrase"])),hasher);
 beforeEach(()=>hasher.hash.mockReset());
 it.each([["short",PasswordTooShortException],["x".repeat(73),PasswordTooLongException],["blocked password phrase",PasswordBlocklistedException],["bad\ud800unicode password",InvalidPasswordUnicodeException]] as const)("rejects invalid replacements before hashing",async(password,error)=>{await expect(service.protect(password as string)).rejects.toThrow(error);expect(hasher.hash).not.toHaveBeenCalled();});
 it("retains exact spaces and Unicode before hashing",async()=>{const hash=new PasswordHashVO("$2b$12$"+"a".repeat(53));hasher.hash.mockResolvedValue(hash);expect(await service.protect("  Unicode пароль 123  ")).toBe(hash);expect(hasher.hash).toHaveBeenCalledWith("  Unicode пароль 123  ");});
 it("allows only non-Admin targets other than self",()=>{const policy=new ManageAccountDPolicy();expect(()=>policy.assertTarget("admin","user","USER")).not.toThrow();expect(()=>policy.assertTarget("admin","admin","USER")).toThrow(AccountAccessDeniedException);expect(()=>policy.assertTarget("admin","other","ADMIN")).toThrow(AccountAccessDeniedException);});
});
