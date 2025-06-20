#!/usr/bin/env node

/**
 * Minimal MCP Test Client
 * 
 * This client tests the minimal MCP server with various method names
 * to identify the correct protocol format.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current file path and directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the minimal server script
const serverPath = path.join(__dirname, 'minimal-mcp-server.js');

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
  console.log('\n📝 Testing with various method name formats...');
  
  // Method names to try
  const methodsToTest = [
    // Method name formats based on schema names
    'list_tools',
    'call_tool',
    '/list_tools',
    '/call_tool',
    'ListToolsRequest',
    'CallToolRequest',
    
    // Namespaced method names
    '/mcp/list_tools',
    '/mcp/call_tool',
    'mcp.list_tools',
    'mcp.call_tool',
    
    // Method names with full schema names
    'ListToolsRequestSchema',
    'CallToolRequestSchema',
    
    // Special format used by some MCP implementations
    'mcp/tools/list',
    'mcp/tools/call',
    '/mcp/tools/list',
    '/mcp/tools/call'
  ];
  
  let index = 0;
  
  // Send requests with different method names at intervals
  const sendNextRequest = () => {
    if (index < methodsToTest.length) {
      const method = methodsToTest[index];
      console.log(`\n🔍 Testing method name: ${method} (${index + 1}/${methodsToTest.length})`);
      sendRequest(method);
      index++;
      setTimeout(sendNextRequest, 1000); // Wait 1 second between requests
    } else {
      console.log('\n✅ Finished testing method formats');
      
      // After testing all methods, try a specific tool call with the most likely method name
      setTimeout(() => {
        console.log('\n📝 Testing echo tool call with most likely method...');
        sendRequest('call_tool', {
          name: 'echo',
          arguments: {
            message: 'Hello from minimal test client!'
          }
        });
        
        // Final cleanup
        setTimeout(() => {
          console.log('\n🏁 Testing complete, shutting down...');
          serverProcess.kill();
        }, 2000);
      }, 1000);
    }
  };
  
  sendNextRequest();
}, 2000); // Wait 2 seconds for server to start
