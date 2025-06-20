// Debug client to inspect server logs
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

// Start the server process with debug logging
const serverProcess = spawn('node', ['dist/index.js', '.'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, DEBUG: 'true', LOG_LEVEL: 'debug' }
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

// Run a sequence of tests with various method name formats
async function runTests() {
  try {
    console.log('Starting debug test with enhanced logging...');
    
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test with standard method names
    console.log('\n1. Testing with "list_tools"');
    sendRequest('list_tools');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test with MCP namespace
    console.log('\n2. Testing with "mcp/list_tools"');
    sendRequest('mcp/list_tools');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test with JSON-RPC namespace
    console.log('\n3. Testing with "jsonrpc/list_tools"');
    sendRequest('jsonrpc/list_tools');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test with server name
    console.log('\n4. Testing with "follow-plan-mcp/list_tools"');
    sendRequest('follow-plan-mcp/list_tools');
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
