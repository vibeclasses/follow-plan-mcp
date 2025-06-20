// MCP format test client
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
          const { method } = pendingRequests.get(response.id);
          console.log(`\nResponse for method "${method}":`);
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

// Run a sequence of tests with MCP format
async function runTests() {
  try {
    console.log('Starting MCP format test...');
    
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test with MCP format methods
    console.log('\n1. Testing with "/mcp/list_tools"');
    sendRequest('/mcp/list_tools');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n2. Testing with "/mcp/call_tool"');
    sendRequest('/mcp/call_tool', {
      name: 'list_tasks',
      arguments: {}
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try with different method name formats
    console.log('\n3. Testing with "mcp.list_tools"');
    sendRequest('mcp.list_tools');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n4. Testing with "/list_tools"');
    sendRequest('/list_tools');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try with method names from the MCP spec
    console.log('\n5. Testing with "/mcp/tools/list"');
    sendRequest('/mcp/tools/list');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n6. Testing with "/mcp/tools/call"');
    sendRequest('/mcp/tools/call', {
      name: 'list_tasks',
      arguments: {}
    });
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
