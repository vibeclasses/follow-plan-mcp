#!/usr/bin/env node

/**
 * Explicit Method MCP Server
 * 
 * A modified MCP server that explicitly sets method names for handlers
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Create a simple logger
const logger = {
  info: (...args) => console.error('[INFO]', ...args),
  debug: (...args) => console.error('[DEBUG]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.error('[WARN]', ...args)
};

// Create a server instance
const server = new Server(
  {
    name: "explicit-method-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Add debug logging for request handling
const serverAny = server;

// Try to access the internal request handlers map
if (serverAny._requestHandlers && serverAny._requestHandlers instanceof Map) {
  const originalSet = serverAny._requestHandlers.set;
  
  // Override the set method to log schema registrations
  serverAny._requestHandlers.set = function(key, value) {
    logger.debug('Registering handler with schema:', key);
    return originalSet.call(this, key, value);
  };
}

// Try to access and modify the handleRequest method
const originalHandleRequest = serverAny._handleRequest || serverAny.handleRequest;

if (originalHandleRequest && typeof originalHandleRequest === 'function') {
  // Override the handler with our debug version
  const debugHandler = async (request) => {
    logger.debug('📥 Incoming request:', JSON.stringify(request, null, 2));
    
    try {
      logger.debug('🔄 Calling original handler...');
      const result = await originalHandleRequest.call(serverAny, request);
      logger.debug('📤 Response:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      logger.error('❌ Error handling request:', error);
      throw error;
    }
  };
  
  // Replace the handler
  if (serverAny._handleRequest) {
    serverAny._handleRequest = debugHandler;
  } else if (serverAny.handleRequest) {
    serverAny.handleRequest = debugHandler;
  }
}

// Explicitly register method names for handlers
// Approach 1: Use method names directly
server.setRequestHandler("list_tools", async (request) => {
  logger.debug('list_tools handler called with:', request.params);
  
  return {
    tools: [
      {
        name: "echo",
        description: "Echo back the input",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Message to echo"
            }
          },
          required: ["message"]
        }
      }
    ]
  };
});

server.setRequestHandler("call_tool", async (request) => {
  logger.debug('call_tool handler called with:', request.params);
  
  const { name, arguments: args } = request.params;
  
  if (name === 'echo') {
    return {
      content: [{ type: "text", text: `Echo: ${args.message}` }]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Approach 2: Use schema objects with method name properties
const enhancedListToolsSchema = { ...ListToolsRequestSchema, methodName: "mcp/tools/list" };
server.setRequestHandler(enhancedListToolsSchema, async (request) => {
  logger.debug('mcp/tools/list handler called with:', request.params);
  
  return {
    tools: [
      {
        name: "echo2",
        description: "Echo back the input (approach 2)",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Message to echo"
            }
          },
          required: ["message"]
        }
      }
    ]
  };
});

const enhancedCallToolSchema = { ...CallToolRequestSchema, methodName: "mcp/tools/call" };
server.setRequestHandler(enhancedCallToolSchema, async (request) => {
  logger.debug('mcp/tools/call handler called with:', request.params);
  
  const { name, arguments: args } = request.params;
  
  if (name === 'echo2') {
    return {
      content: [{ type: "text", text: `Echo2: ${args.message}` }]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function runServer() {
  logger.info('Starting explicit method MCP server...');
  
  // Log the method names we're registering
  logger.info('Registered methods:');
  logger.info('- list_tools (direct string)');
  logger.info('- call_tool (direct string)');
  logger.info('- mcp/tools/list (enhanced schema)');
  logger.info('- mcp/tools/call (enhanced schema)');
  
  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('Explicit method MCP server running on stdio');
}

// Run the server
runServer().catch((error) => {
  logger.error('Fatal error running server:', error);
  process.exit(1);
});
