/**
 * Debug logger utility for MCP protocol debugging
 * Provides enhanced logging for request/response tracing
 */

import { logger } from './logger.js';

/**
 * Debug logger for MCP protocol
 */
export const debugLogger = {
  /**
   * Log incoming JSON-RPC request
   */
  logRequest: (request: any): void => {
    if (!process.env.DEBUG) return;
    
    try {
      logger.debug('🔍 INCOMING REQUEST:', {
        id: request.id,
        method: request.method,
        params: JSON.stringify(request.params, null, 2)
      });
    } catch (error) {
      logger.error('Error logging request:', error);
    }
  },

  /**
   * Log handler match attempt
   */
  logHandlerMatch: (method: string, schema: any, matched: boolean): void => {
    if (!process.env.DEBUG) return;
    
    try {
      const schemaInfo = {
        typeName: schema._def?.typeName,
        shape: Object.keys(schema._def?.shape || {})
      };
      
      logger.debug(`🔄 HANDLER MATCH ${matched ? '✅' : '❌'}: ${method}`, {
        schema: schemaInfo,
        matched
      });
    } catch (error) {
      logger.error('Error logging handler match:', error);
    }
  },

  /**
   * Log response being sent
   */
  logResponse: (id: string, response: any, error?: any): void => {
    if (!process.env.DEBUG) return;
    
    try {
      if (error) {
        logger.debug(`📤 RESPONSE ERROR for request ${id}:`, {
          error: error.message || error
        });
      } else {
        logger.debug(`📤 RESPONSE SUCCESS for request ${id}:`, {
          response: JSON.stringify(response, null, 2)
        });
      }
    } catch (err) {
      logger.error('Error logging response:', err);
    }
  },

  /**
   * Log schema validation
   */
  logSchemaValidation: (schema: any, data: any, success: boolean, error?: any): void => {
    if (!process.env.DEBUG) return;
    
    try {
      logger.debug(`🔍 SCHEMA VALIDATION ${success ? '✅' : '❌'}:`, {
        schemaType: schema._def?.typeName,
        data: JSON.stringify(data, null, 2),
        error: error ? (error.message || error) : undefined
      });
    } catch (err) {
      logger.error('Error logging schema validation:', err);
    }
  }
};
