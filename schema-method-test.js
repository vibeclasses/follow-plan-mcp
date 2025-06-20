#!/usr/bin/env node

/**
 * Schema Method Test
 * 
 * This script tests creating schemas with the correct method property structure
 * for MCP SDK handler registration.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

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
    name: "schema-method-test",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Create schemas with explicit method properties
// Based on error message: "const method = requestSchema.shape.method.value;"
const ListToolsSchema = z.object({
  method: z.literal('list_tools'),
  params: z.object({}).optional()
});

const CallToolSchema = z.object({
  method: z.literal('call_tool'),
  params: z.object({
    name: z.string(),
    arguments: z.record(z.any())
  })
});

// Register handlers with our custom schemas
logger.info('Registering ListToolsSchema handler...');
try {
  server.setRequestHandler(ListToolsSchema, async (request) => {
    logger.debug('ListToolsSchema handler called with:', request.params);
    
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
  logger.info('ListToolsSchema handler registered successfully');
} catch (error) {
  logger.error('Error registering ListToolsSchema handler:', error);
}

logger.info('Registering CallToolSchema handler...');
try {
  server.setRequestHandler(CallToolSchema, async (request) => {
    logger.debug('CallToolSchema handler called with:', request.params);
    
    const { name, arguments: args } = request.params;
    
    if (name === 'echo') {
      return {
        content: [{ type: "text", text: `Echo: ${args.message}` }]
      };
    }
    
    throw new Error(`Unknown tool: ${name}`);
  });
  logger.info('CallToolSchema handler registered successfully');
} catch (error) {
  logger.error('Error registering CallToolSchema handler:', error);
}

// Inspect the server's request handlers
const serverAny = server;
if (serverAny._requestHandlers && serverAny._requestHandlers instanceof Map) {
  logger.info(`Server has ${serverAny._requestHandlers.size} registered handlers`);
  
  serverAny._requestHandlers.forEach((handler, schema) => {
    logger.info('Handler registered with schema:');
    
    try {
      // Log schema structure
      logger.info('Schema type:', typeof schema);
      
      if (schema._def) {
        logger.info('Schema _def:', JSON.stringify(schema._def, null, 2));
      }
      
      if (schema.shape && schema.shape.method) {
        logger.info('Schema method:', schema.shape.method);
        if (schema.shape.method.value) {
          logger.info('Schema method value:', schema.shape.method.value);
        }
      }
    } catch (err) {
      logger.error('Error inspecting schema:', err);
    }
  });
} else {
  logger.warn('Server does not have _requestHandlers Map or it is empty');
}

// Add debug interceptor for request handling
if (serverAny._handleRequest || serverAny.handleRequest) {
  const originalHandleRequest = serverAny._handleRequest || serverAny.handleRequest;
  
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
  
  logger.info('Debug request interceptor installed');
} else {
  logger.warn('Could not install debug interceptor: handleRequest method not found');
}

// Start the server
async function runServer() {
  logger.info('Starting schema method test server...');
  
  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('Schema method test server running on stdio');
}

// Run the server
runServer().catch((error) => {
  logger.error('Fatal error running server:', error);
  process.exit(1);
});
