// MCP Test Client using the exact protocol format
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

// Start the server process
const serverProcess = spawn('node', ['dist/index.js', '.'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Track responses by ID
const pendingRequests = new Map();

// Listen for server output
serverProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      // Check if it's a JSON-RPC response
      if (line.includes('"jsonrpc"')) {
        const response = JSON.parse(line);
        if (response.id && pendingRequests.has(response.id)) {
          const { method, params } = pendingRequests.get(response.id);
          console.log(`\nResponse for method "${method}" with params:`, params);
          console.log(JSON.stringify(response, null, 2));
          pendingRequests.delete(response.id);
        }
      } else {
        console.log(`Server output: ${line}`);
      }
    } catch (err) {
      console.log(`Server output (non-JSON): ${line}`);
    }
  }
});

serverProcess.stderr.on('data', (data) => {
  console.log(`Server error: ${data}`);
});

// Helper function to send a request
function sendRequest(method, params = {}) {
  const id = randomUUID();
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
  
  console.log(`\nSending request with method: ${method}`);
  console.log(`Params: ${JSON.stringify(params, null, 2)}`);
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
  pendingRequests.set(id, { method, params });
  return id;
}

// Run a sequence of tests
async function runTests() {
  try {
    console.log('Starting MCP protocol test...');
    
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: List tools using MCP protocol format
    console.log('\n1. Testing list_tools with MCP protocol format...');
    sendRequest('/mcp/list_tools');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Call tool using MCP protocol format
    console.log('\n2. Testing call_tool with MCP protocol format...');
    sendRequest('/mcp/call_tool', {
      name: 'create_task',
      arguments: {
        title: 'Test Task',
        description: 'This is a test task created by the MCP test client',
        status: 'todo',
        priority: 'medium',
        tags: ['test', 'mcp']
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: List resources using MCP protocol format
    console.log('\n3. Testing list_resources with MCP protocol format...');
    sendRequest('/mcp/list_resources');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Try with different format
    console.log('\n4. Testing with different format...');
    sendRequest('mcp.list_tools');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Final wait and cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('\nTests completed. Shutting down server...');
    serverProcess.kill();
    
  } catch (error) {
    console.error('Error during tests:', error);
    serverProcess.kill();
  }
}

// Run the tests
runTests();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  serverProcess.kill();
  process.exit(0);
});
