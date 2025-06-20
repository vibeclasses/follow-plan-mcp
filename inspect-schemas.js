// Script to inspect MCP SDK schemas
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Print schema details
console.log('ListToolsRequestSchema:');
console.log(JSON.stringify(ListToolsRequestSchema, null, 2));

console.log('\nCallToolRequestSchema:');
console.log(JSON.stringify(CallToolRequestSchema, null, 2));

console.log('\nListResourcesRequestSchema:');
console.log(JSON.stringify(ListResourcesRequestSchema, null, 2));

console.log('\nReadResourceRequestSchema:');
console.log(JSON.stringify(ReadResourceRequestSchema, null, 2));
