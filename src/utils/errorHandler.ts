// src/utils/errorHandler.ts
import type { AstroCookies } from 'astro';


type ErrorType = 'auth' | 'validation' | 'server' | 'notFound' | 'rateLimit' | 'database' | 'file';

interface ErrorResponse {
  statusCode: number;
  message: string;
  type: ErrorType;
  error?: string;
  requestId?: string;
  stack?: string;
  details?: Record<string, unknown>;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public type: ErrorType,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(400, message, 'validation');
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(401, message, 'auth');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(500, message, 'database');
  }
}

export class FileError extends AppError {
  constructor(message: string) {
    super(500, message, 'file');
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
): ErrorResponse => {
  const isProduction = context?.isProduction ?? process.env.NODE_ENV === 'production';
  const requestId = context?.requestId;

  // Handle known error types
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      type: err.type,
      requestId,
      stack: isProduction ? undefined : err.stack,
      details: err instanceof ValidationError ? (err as ValidationError).details : undefined
    };
  }

  // Handle unknown errors
  return {
    statusCode: 500,
    message: isProduction ? 'Internal Server Error' : err.message,
    type: 'server',
    requestId,
    stack: isProduction ? undefined : err.stack
  };
};

import type { APIContext } from 'astro';

export const apiErrorHandler = (err: Error, context: APIContext) => {
  const response = handleError(err, {
    requestId: context.request.headers.get('x-request-id') ?? undefined,
    isProduction: process.env.NODE_ENV === 'production'
  });

  return new Response(JSON.stringify({
    error: {
      message: response.message,
      type: response.type,
      ...(response.details && { details: response.details }),
      ...(response.requestId && { requestId: response.requestId })
    }
  }), {
    status: response.statusCode,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};