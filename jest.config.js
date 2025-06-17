export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapping: {
    "^(\\\\.{1,2}/.*)\\\\.js$": "$1",
  },
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/?(*.)+(spec|test).ts"
  ],
  transform: {
    "^.+\\\\.ts$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        module: "esnext"
      }
    }]
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.test.ts"
  ],
  coverageDirectory: "coverage",
  coverageReporters: [
    "text",
    "text-summary", 
    "html",
    "lcov"
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup.ts"],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  testTimeout: 30000
};
