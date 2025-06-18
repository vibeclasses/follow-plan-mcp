import { FollowPlanServer } from "../../src/index.js";
import { promises as fs } from "fs";
import path from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

describe("FollowPlanServer", () => {
  let server: FollowPlanServer;
  let testProjectRoot: string;

  beforeEach(async () => {
    testProjectRoot = path.join(tmpdir(), `test-${randomBytes(8).toString("hex")}`);
    await fs.mkdir(testProjectRoot, { recursive: true });
    server = new FollowPlanServer(testProjectRoot);
  });

  afterEach(async () => {
    try {
      await fs.rm(testProjectRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test("should initialize server", () => {
    expect(server).toBeDefined();
  });

  test("should create directory structure", async () => {
    await server.ensureDirectoryStructure();
    
    const planDir = path.join(testProjectRoot, ".plan");
    const stat = await fs.stat(planDir);
    expect(stat.isDirectory()).toBe(true);
  });
});
