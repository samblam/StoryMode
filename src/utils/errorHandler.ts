// src/utils/errorHandler.ts
import type { AstroCookies } from 'astro';


type ErrorType = 'auth' | 'validation' | 'server' | 'notFound' | 'rateLimit' | 'database' | 'file';

interface ErrorResponse {
  statusCode: number;
  message: string;
  type: ErrorType;
  requestId?: string;
  timestamp?: string;
  stack?: string;
  details?: Record<string, unknown>;
  userAgent?: string;
  cause?: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public type: ErrorType,
    public isOperational: boolean = true,
    public details?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, message, 'validation', true, details);
  }
}

export class AuthError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(401, message, 'auth', true, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(500, message, 'database', true, details);
  }
}

export class FileError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(500, message, 'file', true, details);
  }
}

export const handleError = (
  err: Error,
  context?: {
    request?: Request;
    cookies?: AstroCookies;
    requestId?: string;
    isProduction?: boolean;
  }
): Response => {
  const isProduction = context?.isProduction ?? process.env.NODE_ENV === 'production';
  const requestId = context?.requestId;

  // Log error in development
  if (!isProduction) {
    console.error('[Error]', {
      message: err.message,
      stack: err.stack,
      details: err instanceof AppError ? (err as AppError).details : undefined
    });
  }

  // Extract request context
  const userAgent = context?.request?.headers.get('user-agent');
  const xRequestId = context?.request?.headers.get('x-request-id');

  // Ensure requestId is always a string
  const finalRequestId = xRequestId || requestId || 'unknown';
 
   const errorResponse: ErrorResponse = {
     statusCode: err instanceof AppError ? err.statusCode : 500,
     message: err instanceof AppError ? err.message : (isProduction ? 'Internal Server Error' : err.message),
     type: err instanceof AppError ? err.type : 'server',
     requestId: finalRequestId,
     timestamp: new Date().toISOString(),
     // Always exclude stack traces in production
     stack: undefined,
     // Standardize detail formatting
     details: err instanceof AppError ? {
       ...(err.details || {}),
       // Include FileError specific details
       ...(err instanceof FileError ? { filePath: err.details?.filePath } : {})
     } : undefined,
     userAgent: isProduction ? undefined : userAgent || undefined,
     cause: err.cause ? (isProduction && !(err instanceof AppError && err.isOperational) ? 'Internal error' : err.cause.toString()) : undefined,
   };

   // Only include development-specific fields if not in production
   if (!isProduction) {
     errorResponse.stack = err.stack;
     if (err instanceof AppError) {
       errorResponse.details = {
         ...errorResponse.details,
         // Include additional debug information for FileError
         ...(err instanceof FileError ? {
           fileSize: err.details?.fileSize,
           operation: err.details?.operation
         } : {})
       };
     }
   }
 
   // Log errors appropriately
   if (!isProduction) {
     console.error(
       `[Error] ${err.message} - Details: ${JSON.stringify({
         stack: err.stack,
         details: err instanceof AppError ? err.details : undefined,
         requestId: finalRequestId,
       })}`
     );
   } else if (err instanceof AppError && err.isOperational) {
     console.error(`[Operational Error] ${err.message}`, {
       requestId: finalRequestId,
       type: err.type,
       cause: err.cause?.toString(),
     });
   }
 
   return new Response(JSON.stringify(errorResponse), {
     status: errorResponse.statusCode,
     headers: {
       'Content-Type': 'application/json'
     }
   });
 };
 
 export const apiErrorHandler = (
   err: Error,
   context?: {
     request?: Request;
     cookies?: AstroCookies;
     requestId?: string;
     isProduction?: boolean;
   }
 ): Response => {
   return handleError(err, context);
 };