import { AuthenticationController } from "#entrypoint/AuthenticationController";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";

describe("AuthenticationController", () => {
  const controller = new AuthenticationController({ execute: jest.fn() }, { execute: jest.fn() }, { execute: jest.fn() }, "http://127.0.0.1:5173", false);
  it("preserves exact credentials", () => {
    expect(controller.credentials({ email: " USER@example.test ", password: " secret " })).toEqual({ email: " USER@example.test ", password: " secret " });
  });
  it.each([null, [], "", {}, { email: 1, password: "x" }, { email: "x", password: 1 }, { email: "x", password: "x", role: "ADMIN" }])("rejects malformed/injected input", body => {
    expect(() => controller.credentials(body)).toThrow(InvalidRequestBodyException);
  });
  it("accepts only one unambiguous bounded cookie", () => {
    expect(controller.cookie({ headers: { cookie: "other=x; roombook_session=a.b.c" } })).toBe("a.b.c");
    for (const cookie of [undefined, "roombook_session=a; roombook_session=b", "roombook_session=%bad", "roombook_session=" + "a".repeat(2049)]) {
      expect(controller.cookie({ headers: { cookie } })).toBe("");
    }
  });
});
