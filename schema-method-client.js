#!/usr/bin/env node

/**
 * Schema Method Test Client
 * 
 * This client tests interaction with the schema-method-test server
 * using the correct method names.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current file path and directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the schema method test server script
const serverPath = path.join(__dirname, 'schema-method-test.js');

// Spawn the server process
const serverProcess = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Set up event handlers for the server process
serverProcess.stdout.on('data', (data) => {
  try {
    // Try to parse as JSON
    const response = JSON.parse(data.toString());
    console.log('\n🟢 Server response:', JSON.stringify(response, null, 2));
    
    // Check for method not found errors
    if (response.error && response.error.message && response.error.message.includes('Method not found')) {
      console.log('❌ Method not found error detected');
    } else if (response.result) {
      console.log('✅ Successful response received');
    }
  } catch (error) {
    // If not valid JSON, just log as text
    console.log('\n🔵 Server output:', data.toString());
  }
});

serverProcess.stderr.on('data', (data) => {
  console.log('\n🟠 Server log:', data.toString());
});

serverProcess.on('error', (error) => {
  console.error('\n🔴 Error spawning server:', error);
});

serverProcess.on('close', (code) => {
  console.log(`\n🟣 Server process exited with code ${code}`);
});

// Function to send a JSON-RPC request to the server
function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now().toString(),
    method,
    params
  };
  
  console.log('\n🟡 Sending request:', JSON.stringify(request, null, 2));
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
}

// Wait for server to start up
setTimeout(() => {
  console.log('\n📝 Testing with correct method names...');
  
  // Test list_tools method
  console.log('\n🔍 Testing method: list_tools');
  sendRequest('list_tools', {});
  
  // Wait and then test call_tool method
  setTimeout(() => {
    console.log('\n🔍 Testing method: call_tool');
    sendRequest('call_tool', {
      name: 'echo',
      arguments: {
        message: 'Hello from schema method client!'
      }
    });
    
    // Final cleanup
    setTimeout(() => {
      console.log('\n🏁 Testing complete, shutting down...');
      serverProcess.kill();
    }, 2000);
  }, 2000);
}, 2000); // Wait 2 seconds for server to start
