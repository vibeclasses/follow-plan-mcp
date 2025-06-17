import { jest } from "@jest/globals";

// Global test setup
beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.MCP_ENABLE_FILE_LOGGING = "false";
});

afterAll(() => {
  jest.clearAllMocks();
});
