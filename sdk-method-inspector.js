#!/usr/bin/env node

/**
 * MCP SDK Method Inspector
 * 
 * This script inspects the MCP SDK to understand how method names are mapped to handlers.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Create a simple logger
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  debug: (...args) => console.log('[DEBUG]', ...args),
  error: (...args) => console.log('[ERROR]', ...args),
  warn: (...args) => console.log('[WARN]', ...args)
};

// Create a server instance
logger.info('Creating MCP server instance...');
const server = new Server(
  {
    name: "sdk-method-inspector",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register a simple handler to inspect schema-to-method mapping
logger.info('Registering ListToolsRequestSchema handler...');
server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  logger.debug('ListToolsRequestSchema handler called with:', request.params);
  return { tools: [] };
});

// Inspect the server object
logger.info('Inspecting server object...');
const serverAny = server;

// Inspect _requestHandlers Map
if (serverAny._requestHandlers && serverAny._requestHandlers instanceof Map) {
  logger.info(`Server has ${serverAny._requestHandlers.size} registered handlers`);
  
  serverAny._requestHandlers.forEach((handler, schema) => {
    logger.info('Handler registered with schema:');
    
    // Try to extract schema information
    try {
      // Inspect schema object
      logger.info('Schema type:', typeof schema);
      
      // Check for common schema properties
      const properties = [
        '_def', 'typeName', 'shape', 'method', 'name', 'description',
        'toString', 'parse', 'safeParse'
      ];
      
      properties.forEach(prop => {
        if (schema[prop] !== undefined) {
          if (typeof schema[prop] === 'function') {
            logger.info(`- schema.${prop}: [Function]`);
            
            // Try calling toString on functions
            try {
              const fnString = schema[prop].toString().substring(0, 100) + '...';
              logger.info(`  Function: ${fnString}`);
            } catch (e) {
              logger.info(`  Cannot stringify function: ${e.message}`);
            }
          } else if (typeof schema[prop] === 'object') {
            logger.info(`- schema.${prop}: [Object]`);
            logger.info(`  Keys: ${Object.keys(schema[prop]).join(', ')}`);
            
            // If it's _def, inspect deeper
            if (prop === '_def') {
              const def = schema._def;
              logger.info(`  _def.typeName: ${def.typeName}`);
              
              if (def.shape) {
                logger.info(`  _def.shape keys: ${Object.keys(def.shape).join(', ')}`);
              }
            }
          } else {
            logger.info(`- schema.${prop}: ${schema[prop]}`);
          }
        }
      });
      
      // Try to extract method name or identifier
      if (schema._def && schema._def.typeName) {
        logger.info(`Schema typeName: ${schema._def.typeName}`);
      }
      
      // Try to call schema.parse to see what it expects
      try {
        const sampleRequest = {
          jsonrpc: '2.0',
          id: '1',
          method: schema._def?.typeName || 'unknown',
          params: {}
        };
        
        logger.info('Attempting to parse sample request with schema...');
        const parseResult = schema.safeParse(sampleRequest);
        
        if (parseResult.success) {
          logger.info('Parse succeeded:', parseResult.data);
        } else {
          logger.info('Parse failed:', parseResult.error);
        }
      } catch (e) {
        logger.info('Error parsing sample request:', e.message);
      }
    } catch (err) {
      logger.error('Error inspecting schema:', err);
    }
  });
} else {
  logger.warn('Server does not have _requestHandlers Map or it is empty');
}

// Inspect handleRequest method
if (typeof serverAny._handleRequest === 'function' || typeof serverAny.handleRequest === 'function') {
  const handleRequestFn = serverAny._handleRequest || serverAny.handleRequest;
  logger.info('handleRequest function found:', handleRequestFn.toString().substring(0, 200) + '...');
} else {
  logger.warn('handleRequest method not found on server object');
}

// Try to find method name mapping logic
logger.info('Searching for method name mapping logic...');

// Check for any properties that might contain method mapping
for (const key of Object.keys(serverAny)) {
  if (key.toLowerCase().includes('method') || key.toLowerCase().includes('handler')) {
    logger.info(`Found potential method-related property: ${key}`);
    
    try {
      const value = serverAny[key];
      if (typeof value === 'function') {
        logger.info(`- ${key} is a function`);
      } else if (typeof value === 'object' && value !== null) {
        logger.info(`- ${key} is an object with keys: ${Object.keys(value).join(', ')}`);
      } else {
        logger.info(`- ${key} is a ${typeof value}: ${String(value).substring(0, 100)}`);
      }
    } catch (e) {
      logger.info(`- Error inspecting ${key}: ${e.message}`);
    }
  }
}

// Try to access the JSON-RPC method name mapping directly from the schema
logger.info('Attempting to find method name in schema...');
try {
  // Check if ListToolsRequestSchema has a method name property
  const schemaKeys = Object.keys(ListToolsRequestSchema);
  logger.info('ListToolsRequestSchema keys:', schemaKeys);
  
  // Check common properties that might contain the method name
  ['method', 'name', 'id', 'type', 'typeName'].forEach(propName => {
    if (ListToolsRequestSchema[propName] !== undefined) {
      logger.info(`ListToolsRequestSchema.${propName} =`, ListToolsRequestSchema[propName]);
    }
  });
  
  // Check if schema has a toString method that might reveal the method name
  if (typeof ListToolsRequestSchema.toString === 'function') {
    logger.info('ListToolsRequestSchema.toString() =', ListToolsRequestSchema.toString());
  }
  
  // Check if there's a static property or method that returns the method name
  if (typeof ListToolsRequestSchema.getMethodName === 'function') {
    logger.info('ListToolsRequestSchema.getMethodName() =', ListToolsRequestSchema.getMethodName());
  }
} catch (e) {
  logger.error('Error inspecting ListToolsRequestSchema:', e);
}

logger.info('SDK Method Inspector complete');
