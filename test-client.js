#!/usr/bin/env node

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import path from 'path';

const serverPath = path.join(__dirname, 'dist', 'index.js');

async function testFollowPlanMCP() {
  console.log('Starting Follow Plan MCP test client...');
  
  // Spawn the server process
  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, DEBUG: 'true' }
  });
  
  // Set up event handlers
  serverProcess.stdout.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      console.log('\n🟢 Server response:', JSON.stringify(response, null, 2));
    } catch (error) {
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
  
  // Helper function to send requests to the server
  function sendRequest(method, params = {}) {
    const requestId = randomUUID();
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    };
    
    console.log('\n🟡 Sending request:', JSON.stringify(request, null, 2));
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
    return requestId;
  }
  
  try {
    // Wait for server to initialize
    console.log('Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    
    let index = 0;
    console.log('\n3. Listing tasks...');
    sendRequest('call_tool', {
      name: 'list_tasks',
      arguments: {}
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test creating a feature
    console.log('\n4. Creating a test feature...');
    sendRequest('call_tool', {
      name: 'create_feature',
      arguments: {
        title: 'Test Feature',
        description: 'This is a test feature created by the test client',
        status: 'proposed',
        priority: 'high'
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // List features
    console.log('\n5. Listing features...');
    sendRequest('call_tool', {
      name: 'list_features',
      arguments: {}
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test search functionality
    console.log('\n6. Testing search...');
    sendRequest('call_tool', {
      name: 'search',
      arguments: {
        query: 'test',
        types: ['task', 'feature']
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Allow time for final responses
    console.log('\nWaiting for final responses...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Close the server process
    console.log('\nShutting down server...');
    serverProcess.kill();
    console.log('Test completed');
  }
}

testFollowPlanMCP().catch(console.error);
