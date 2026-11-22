import { readFileSync } from "node:fs";
import { LocalPasswordBlocklist } from "#infrastructure/Configuration/LocalPasswordBlocklist";
import { BlocklistLoadingException } from "#infrastructure/Exception/BlocklistLoadingException";

jest.mock("node:fs", () => ({
  ...jest.requireActual<typeof import("node:fs")>("node:fs"),
  readFileSync: jest.fn(),
}));

describe("infrastructure", () => {
  describe("configuration.infrastructure", () => {
    describe("LocalPasswordBlocklist", () => {
      it("loads configured complete values through the mocked filesystem", () => {
        jest.mocked(readFileSync).mockReturnValue(Buffer.from(JSON.stringify(["passwordpassword"])));
        expect(new LocalPasswordBlocklist().load("data/test.json").has("passwordpassword")).toBe(true);
      });
      it.each(["invalid JSON", "{}", "[]", "[42]"])("rejects malformed configuration", (text) => {
        jest.mocked(readFileSync).mockReturnValue(Buffer.from(text));
        expect(() => new LocalPasswordBlocklist().load("data/test.json"))
          .toThrow(BlocklistLoadingException);
      });
      it("rejects excessive configuration size", () => {
        jest.mocked(readFileSync).mockReturnValue(Buffer.alloc(1_000_001));
        expect(() => new LocalPasswordBlocklist().load("data/test.json"))
          .toThrow(BlocklistLoadingException);
      });
      it("wraps filesystem failures", () => {
        jest.mocked(readFileSync).mockImplementationOnce(() => { throw new Error("private path"); });
        expect(() => new LocalPasswordBlocklist().load("data/test.json"))
          .toThrow(BlocklistLoadingException);
      });
    });
  });
});
