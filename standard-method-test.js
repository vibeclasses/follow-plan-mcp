#!/usr/bin/env node

/**
 * Standard MCP Method Test Client
 * 
 * This client tests standard MCP method names based on reference implementation patterns
 * and logs detailed information about requests and responses.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path and directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the server script
const serverPath = path.join(__dirname, 'dist', 'index.js');

// Spawn the server process with debug logging enabled
const serverProcess = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, DEBUG: 'true' }
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
  console.log('\n📝 Testing standard MCP method names based on reference implementation...');
  
  // Standard MCP method names based on reference implementation pattern
  const standardMethods = [
    // Standard MCP method patterns
    '/mcp/tools/list',
    '/mcp/tools/call',
    '/mcp/resources/list',
    '/mcp/resources/read',
    
    // Schema-based method names
    'ListToolsRequest',
    'CallToolRequest',
    'ListResourcesRequest',
    'ReadResourceRequest',
    
    // Direct schema object names
    'ListToolsRequestSchema',
    'CallToolRequestSchema',
    'ListResourcesRequestSchema',
    'ReadResourceRequestSchema',
    
    // Previously tested formats
    'list_tools',
    'call_tool'
  ];
  
  // Send requests with different method names at intervals
  let index = 0;
  
  const sendNextRequest = () => {
    if (index < standardMethods.length) {
      const method = standardMethods[index];
      console.log(`\n🔍 Testing method name: ${method} (${index + 1}/${standardMethods.length})`);
      sendRequest(method);
      index++;
      setTimeout(sendNextRequest, 1500); // Wait 1.5 seconds between requests
    } else {
      console.log('\n✅ Finished testing standard method formats');
      
      // After testing standard methods, try specific tool calls
      setTimeout(() => {
        console.log('\n📝 Testing tool calls with most likely method names...');
        
        // Try /mcp/tools/call format
        console.log('\n🔍 Testing tool call with /mcp/tools/call');
        sendRequest('/mcp/tools/call', {
          name: 'create_task',
          arguments: {
            title: 'Test Task',
            description: 'This is a test task'
          }
        });
        
        // Wait and try CallToolRequest format
        setTimeout(() => {
          console.log('\n🔍 Testing tool call with CallToolRequest');
          sendRequest('CallToolRequest', {
            name: 'create_task',
            arguments: {
              title: 'Test Task',
              description: 'This is a test task'
            }
          });
          
          // Wait and try call_tool format
          setTimeout(() => {
            console.log('\n🔍 Testing tool call with call_tool');
            sendRequest('call_tool', {
              name: 'create_task',
              arguments: {
                title: 'Test Task',
                description: 'This is a test task'
              }
            });
            
            // Final cleanup
            setTimeout(() => {
              console.log('\n🏁 Testing complete, shutting down...');
              serverProcess.kill();
            }, 2000);
          }, 1500);
        }, 1500);
      }, 1500);
    }
  };
  
  sendNextRequest();
}, 2000); // Wait 2 seconds for server to start
