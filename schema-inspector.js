// Schema inspector for MCP SDK
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Function to inspect schema objects
function inspectSchema(name, schema) {
  console.log(`\n=== Inspecting ${name} ===`);
  
  // Try to extract method name or other identifying information
  console.log('Schema object keys:', Object.keys(schema));
  
  // Check for common properties that might contain method name
  if (schema.method) console.log('Method property:', schema.method);
  if (schema._def) console.log('_def property keys:', Object.keys(schema._def));
  if (schema._def?.method) console.log('_def.method:', schema._def.method);
  
  // Check for any string properties that might be method names
  for (const key of Object.keys(schema)) {
    if (typeof schema[key] === 'string') {
      console.log(`${key}:`, schema[key]);
    }
  }
  
  // Try to stringify the schema (might be too large/circular)
  try {
    console.log('Schema JSON:', JSON.stringify(schema, null, 2));
  } catch (err) {
    console.log('Cannot stringify schema:', err.message);
    
    // Try to extract specific properties
    if (schema._def) {
      try {
        console.log('_def JSON:', JSON.stringify(schema._def, null, 2));
      } catch (innerErr) {
        console.log('Cannot stringify _def:', innerErr.message);
      }
    }
  }
}

// Inspect all schemas
console.log('Inspecting MCP SDK schemas to find method names...');

inspectSchema('ListToolsRequestSchema', ListToolsRequestSchema);
inspectSchema('CallToolRequestSchema', CallToolRequestSchema);
inspectSchema('ListResourcesRequestSchema', ListResourcesRequestSchema);
inspectSchema('ReadResourceRequestSchema', ReadResourceRequestSchema);

// Try to access internal properties that might contain method names
console.log('\n=== Attempting to access internal properties ===');

// Try to access typeName if it exists
const schemas = [
  { name: 'ListToolsRequestSchema', schema: ListToolsRequestSchema },
  { name: 'CallToolRequestSchema', schema: CallToolRequestSchema },
  { name: 'ListResourcesRequestSchema', schema: ListResourcesRequestSchema },
  { name: 'ReadResourceRequestSchema', schema: ReadResourceRequestSchema }
];

for (const { name, schema } of schemas) {
  console.log(`\nExamining ${name}:`);
  
  // Try different property paths that might contain the method name
  const paths = [
    '_def.typeName',
    '_def.method',
    '_def.name',
    '_def.path',
    'typeName',
    'method',
    'name',
    'path'
  ];
  
  for (const path of paths) {
    try {
      const parts = path.split('.');
      let value = schema;
      for (const part of parts) {
        value = value[part];
      }
      if (value) {
        console.log(`${path} =`, value);
      }
    } catch (err) {
      // Silently ignore errors
    }
  }
}

console.log('\nInspection complete.');
