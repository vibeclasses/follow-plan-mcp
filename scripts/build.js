#!/usr/bin/env node

import { spawn } from "child_process";

console.log("🔨 Building Follow Plan MCP...");

const build = spawn("tsc", [], { stdio: "inherit" });

build.on("close", (code) => {
  if (code === 0) {
    console.log("✅ Build completed successfully!");
  } else {
    console.error("❌ Build failed!");
    process.exit(1);
  }
});
