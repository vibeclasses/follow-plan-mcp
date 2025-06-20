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
      if (line.includes('"jsonrpc":"2.0"') || line.includes('"jsonrpc": "2.0"')) {
        const response = JSON.parse(line);
        if (response.id && pendingRequests.has(response.id)) {
          const method = pendingRequests.get(response.id);
          console.log(`Response for method "${method}":`);
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
function sendRequest(method) {
  const id = randomUUID();
  const request = {
    jsonrpc: '2.0',
    id,
    method
  };
  
  console.log(`\nTrying method: ${method}`);
  serverProcess.stdin.write(JSON.stringify(request) + '\n');
  pendingRequests.set(id, method);
  return id;
}

// Try different method formats for listing tools
const methods = [
  'list_tools',
  'listTools',
  'mcp.list_tools',
  'mcp.listTools',
  'rpc.list_tools',
  'rpc.listTools',
  '/list_tools',
  '/listTools',
  'ListTools',
  'list-tools',
  'tools.list'
];

// Send each method with a delay
console.log('Starting method format test...');
console.log('Testing different method name formats for listing tools...');

let index = 0;
const interval = setInterval(() => {
  if (index >= methods.length) {
    clearInterval(interval);
    console.log('\nAll method formats tested.');
    
    setTimeout(() => {
      console.log('Shutting down server...');
      serverProcess.kill();
      console.log('Test completed');
    }, 2000);
    return;
  }
  
  sendRequest(methods[index]);
  index++;
}, 1000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  serverProcess.kill();
  process.exit(0);
});
