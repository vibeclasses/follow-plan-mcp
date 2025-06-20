#!/usr/bin/env node

/**
 * Minimal MCP Server
 * 
 * A simplified MCP server implementation to isolate and debug protocol issues
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

// Create a minimal server
const server = new Server(
  {
    name: "minimal-mcp-server",
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
const originalHandleRequest = serverAny._handleRequest || serverAny.handleRequest;

if (originalHandleRequest && typeof originalHandleRequest === 'function') {
  // Override the handler with our debug version
  const debugHandler = async (request) => {
    logger.debug('📥 Incoming request:', JSON.stringify(request, null, 2));
    
    // Log all registered handlers and their schemas
    const handlers = serverAny._requestHandlers || new Map();
    if (handlers && handlers.size > 0) {
      logger.debug(`🔧 Registered handlers (${handlers.size}):`);
      handlers.forEach((handler, schema) => {
        try {
          const schemaInfo = {
            typeName: schema._def?.typeName,
            shape: Object.keys(schema._def?.shape || {})
          };
          logger.debug(`- Handler schema:`, JSON.stringify(schemaInfo, null, 2));
        } catch (err) {
          logger.debug(`- Handler schema: [Error inspecting schema]`);
        }
      });
    }
    
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
  
  logger.debug('Debug request interceptor installed');
} else {
  logger.warn('Could not install debug interceptor: handleRequest method not found');
}

// Register a simple list_tools handler
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  logger.debug('ListToolsRequestSchema handler called with:', request.params);
  
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

// Register a simple call_tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  logger.debug('CallToolRequestSchema handler called with:', request.params);
  
  const { name, arguments: args } = request.params;
  
  if (name === 'echo') {
    return {
      content: [{ type: "text", text: `Echo: ${args.message}` }]
    };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start the server
async function runServer() {
  logger.info('Starting minimal MCP server...');
  
  // Dump the SDK version
  try {
    const packagePath = new URL('../package.json', import.meta.url);
    const packageJson = await import(packagePath, { assert: { type: 'json' } });
    logger.info('MCP SDK version:', packageJson.default.dependencies['@modelcontextprotocol/sdk']);
  } catch (error) {
    logger.error('Could not determine MCP SDK version:', error);
  }
  
  // Log the method names we're registering
  logger.info('Registered methods:');
  logger.info('- ListToolsRequestSchema');
  logger.info('- CallToolRequestSchema');
  
  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('Minimal MCP server running on stdio');
}

// Run the server
runServer().catch((error) => {
  logger.error('Fatal error running server:', error);
  process.exit(1);
});
