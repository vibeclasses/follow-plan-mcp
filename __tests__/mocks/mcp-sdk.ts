import { jest } from "@jest/globals";

export const mockServer = {
  setRequestHandler: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
};

export const mockTransport = {
  start: jest.fn(),
  close: jest.fn(),
};
