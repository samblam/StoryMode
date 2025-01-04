import type { APIRoute } from 'astro';
import { ValidationRules, validateInput, sanitizeInput } from './validation';

export function validateBody(rules: { [key: string]: keyof typeof ValidationRules }) {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const errors: { [key: string]: string } = {};
      
      // Validate each field
      Object.entries(rules).forEach(([field, rule]) => {
        const value = body[field];
        if (typeof value === 'string') {
          const error = validateInput(value, rule);
          if (error) {
            errors[field] = error;
          }
          // Sanitize valid inputs
          body[field] = sanitizeInput(value);
        }
      });
      
      if (Object.keys(errors).length > 0) {
        return new Response(
          JSON.stringify({ success: false, errors }),
          { status: 400 }
        );
      }
      
      return { body };
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request body' 
        }),
        { status: 400 }
      );
    }
  };
}