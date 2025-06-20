#!/usr/bin/env node

/**
 * MCP SDK Explorer
 * 
 * This script explores the MCP SDK package structure and exports to find
 * the correct method name format for JSON-RPC requests.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path and directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
const mcpSdkPath = path.join(nodeModulesPath, '@modelcontextprotocol', 'sdk');

// Simple logger
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  debug: (...args) => console.log('[DEBUG]', ...args),
  error: (...args) => console.log('[ERROR]', ...args),
  warn: (...args) => console.log('[WARN]', ...args)
};

// Function to recursively explore directory
async function exploreDirectory(dirPath, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return;
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        logger.debug(`${' '.repeat(depth * 2)}📁 ${entry.name}/`);
        await exploreDirectory(fullPath, depth + 1, maxDepth);
      } else if (entry.isFile()) {
        // Only process JavaScript/TypeScript files
        if (entry.name.endsWith('.js') || entry.name.endsWith('.ts') || 
            entry.name.endsWith('.mjs') || entry.name.endsWith('.cjs') ||
            entry.name === 'package.json') {
          
          logger.debug(`${' '.repeat(depth * 2)}📄 ${entry.name}`);
          
          // Read file content for specific files that might contain method name info
          if (entry.name.includes('json-rpc') || 
              entry.name.includes('server') || 
              entry.name.includes('schema') || 
              entry.name.includes('method') ||
              entry.name.includes('handler') ||
              entry.name === 'types.js' ||
              entry.name === 'package.json') {
            
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              
              // Look for method name patterns in the file
              searchForMethodNames(entry.name, content);
              
              // If it's package.json, log the version
              if (entry.name === 'package.json') {
                try {
                  const packageJson = JSON.parse(content);
                  logger.info(`MCP SDK Version: ${packageJson.version}`);
                } catch (e) {
                  logger.error('Error parsing package.json:', e.message);
                }
              }
            } catch (e) {
              logger.error(`Error reading file ${fullPath}:`, e.message);
            }
          }
        }
      }
    }
  } catch (e) {
    logger.error(`Error exploring directory ${dirPath}:`, e.message);
  }
}

// Function to search for method name patterns in file content
function searchForMethodNames(fileName, content) {
  // Patterns to search for
  const patterns = [
    { regex: /method\s*:\s*["']([^"']+)["']/g, description: 'Method name assignment' },
    { regex: /\.method\s*=\s*["']([^"']+)["']/g, description: 'Method property assignment' },
    { regex: /methodName\s*:\s*["']([^"']+)["']/g, description: 'Method name in object' },
    { regex: /jsonrpc.*?method["']?\s*:\s*["']([^"']+)["']/g, description: 'JSON-RPC method' },
    { regex: /registerMethod\(["']([^"']+)["']/g, description: 'Method registration' },
    { regex: /handleMethod\(["']([^"']+)["']/g, description: 'Method handler' },
    { regex: /export\s+const\s+(\w+RequestSchema)\s*=/g, description: 'Request schema export' },
    { regex: /typeName\s*:\s*["']([^"']+)["']/g, description: 'Type name definition' },
    { regex: /\/mcp\/[a-z]+\/[a-z]+/g, description: 'MCP URL path pattern' }
  ];
  
  let foundAny = false;
  
  patterns.forEach(({ regex, description }) => {
    const matches = [...content.matchAll(regex)];
    if (matches.length > 0) {
      logger.info(`Found ${description} in ${fileName}:`);
      matches.forEach(match => {
        logger.info(`- ${match[1] || match[0]}`);
      });
      foundAny = true;
    }
  });
  
  // Also look for specific strings that might be method names
  const methodNameCandidates = [
    'list_tools', 'call_tool', '/list_tools', '/call_tool',
    'ListToolsRequest', 'CallToolRequest', '/mcp/tools/list', '/mcp/tools/call'
  ];
  
  methodNameCandidates.forEach(candidate => {
    if (content.includes(candidate)) {
      logger.info(`Found method name candidate "${candidate}" in ${fileName}`);
      foundAny = true;
    }
  });
  
  // If this is a schema file, try to find the method name mapping
  if (fileName.includes('schema') || fileName === 'types.js') {
    // Look for schema definitions with method names
    const schemaRegex = /export\s+const\s+(\w+RequestSchema)\s*=/g;
    const schemaMatches = [...content.matchAll(schemaRegex)];
    
    if (schemaMatches.length > 0) {
      logger.info(`Found schema definitions in ${fileName}:`);
      schemaMatches.forEach(match => {
        const schemaName = match[1];
        logger.info(`- ${schemaName}`);
        
        // Try to find method name associated with this schema
        const schemaContext = content.substring(
          Math.max(0, match.index - 200),
          Math.min(content.length, match.index + 500)
        );
        
        // Look for method name in the schema context
        const methodNameRegex = /method\s*:\s*["']([^"']+)["']/g;
        const methodNameMatches = [...schemaContext.matchAll(methodNameRegex)];
        
        if (methodNameMatches.length > 0) {
          logger.info(`  Associated method name: ${methodNameMatches[0][1]}`);
        }
      });
    }
  }
  
  return foundAny;
}

// Main function
async function main() {
  logger.info('Starting MCP SDK Explorer...');
  
  try {
    // Check if MCP SDK exists
    await fs.access(mcpSdkPath);
    logger.info(`MCP SDK found at: ${mcpSdkPath}`);
    
    // Explore the SDK directory
    await exploreDirectory(mcpSdkPath);
    
    // Try to import and inspect the SDK directly
    logger.info('Attempting to import MCP SDK modules...');
    
    try {
      const { ListToolsRequestSchema, CallToolRequestSchema } = await import('@modelcontextprotocol/sdk/types.js');
      
      logger.info('Successfully imported MCP SDK schemas');
      logger.info('ListToolsRequestSchema:', ListToolsRequestSchema);
      logger.info('CallToolRequestSchema:', CallToolRequestSchema);
      
      // Try to access schema properties
      if (ListToolsRequestSchema && typeof ListToolsRequestSchema === 'object') {
        logger.info('ListToolsRequestSchema properties:', Object.keys(ListToolsRequestSchema));
        
        // Check if _def exists and has typeName
        if (ListToolsRequestSchema._def) {
          logger.info('Schema _def:', ListToolsRequestSchema._def);
          logger.info('Schema typeName:', ListToolsRequestSchema._def.typeName);
        }
      }
    } catch (e) {
      logger.error('Error importing MCP SDK modules:', e.message);
    }
    
  } catch (e) {
    logger.error('MCP SDK not found or error accessing it:', e.message);
  }
  
  logger.info('MCP SDK Explorer complete');
}

// Run the main function
main().catch(err => {
  logger.error('Fatal error:', err);
});
