import type { APIRoute } from 'astro';
import type { ValidationError, ValidationResponse } from '../types/app';
import { ValidationRules, validateInput, sanitizeInput } from './validation';

export function validateBody(rules: { [key: string]: keyof typeof ValidationRules }) {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const errors: ValidationError[] = [];
      
      // Validate each field
      Object.entries(rules).forEach(([field, rule]) => {
        const value = body[field];
        if (typeof value === 'string') {
          const error = validateInput(value, rule);
          if (error) {
            errors.push({
              field,
              message: error
            });
          }
          // Sanitize valid inputs
          body[field] = sanitizeInput(value);
        }
      });
      
      if (errors.length > 0) {
        const response: ValidationResponse = {
          success: false,
          errors
        };
        return new Response(JSON.stringify(response), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return { body };
    } catch (error) {
      const response: ValidationResponse = {
        success: false,
        error: 'Invalid request body'
      };
      return new Response(JSON.stringify(response), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}