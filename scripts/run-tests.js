#!/usr/bin/env node

import { spawn } from "child_process";

const testSuites = [
  { name: "Unit Tests", command: "npm", args: ["run", "test:unit"] },
  { name: "Integration Tests", command: "npm", args: ["run", "test:integration"] },
  { name: "Security Tests", command: "npm", args: ["run", "test:security"] },
];

async function runTests() {
  console.log("🧪 Running comprehensive test suite...");
  
  for (const suite of testSuites) {
    console.log(`\n📋 Running ${suite.name}...`);
    
    const result = await new Promise((resolve) => {
      const process = spawn(suite.command, suite.args, { stdio: "inherit" });
      process.on("close", resolve);
    });
    
    if (result === 0) {
      console.log(`✅ ${suite.name} passed`);
    } else {
      console.log(`❌ ${suite.name} failed`);
    }
  }
}

runTests().catch(console.error);
