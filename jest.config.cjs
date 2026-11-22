/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/frontend/tests"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  restoreMocks: true,
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  moduleNameMapper: {
    "^#ui-domain/(.*)$": "<rootDir>/frontend/src/Domain/$1",
    "^#ui-application/(.*)$": "<rootDir>/frontend/src/Application/$1",
    "^#ui-infrastructure/(.*)$": "<rootDir>/frontend/src/Infrastructure/$1",
    "^#ui-entrypoint/(.*)$": "<rootDir>/frontend/src/EntryPoint/$1",
    "^#domain/(.*)$": "<rootDir>/src/Domain/$1",
    "^#application/(.*)$": "<rootDir>/src/Application/$1",
    "^#infrastructure/(.*)$": "<rootDir>/src/Infrastructure/$1",
    "^#entrypoint/(.*)$": "<rootDir>/src/EntryPoint/$1",
  },
  collectCoverageFrom: ["src/Domain/**/*.ts", "src/Application/**/*.ts", "frontend/src/Domain/**/*.ts", "frontend/src/Application/**/*.ts"],
};
