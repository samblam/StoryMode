import { AppError, ValidationError, AuthError, DatabaseError, FileError, handleError, apiErrorHandler } from '../src/utils/errorHandler';
import type { AstroCookies } from 'astro';

describe('Error Handling', () => {
  describe('Custom Error Classes', () => {
    test('AppError creates correct error instance', () => {
      const error = new AppError(400, 'Test Error', 'validation');
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test Error');
      expect(error.type).toBe('validation');
      expect(error.isOperational).toBe(true);
    });

    test('ValidationError includes details', () => {
      const details = { field: 'email', message: 'Invalid format' };
      const error = new ValidationError('Validation failed', details);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });

    test('AuthError sets correct status code', () => {
      const error = new AuthError('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe('auth');
    });

    test('DatabaseError includes details', () => {
      const details = { query: 'SELECT * FROM users', errorCode: '23505' };
      const error = new DatabaseError('Database operation failed', details);
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe('database');
      expect(error.details).toEqual(details);
    });

    test('FileError includes file-specific details', () => {
      const details = { filePath: '/uploads/test.txt', fileSize: 1024 };
      const error = new FileError('File operation failed', details);
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe('file');
      expect(error.details).toEqual(details);
    });

    test('FileError handles missing details', () => {
      const error = new FileError('File operation failed');
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe('file');
      expect(error.details).toBeUndefined();
    });

    test('ValidationError includes multiple fields', () => {
      const details = {
        fields: {
          email: true,
          password: false
        },
        requiredFields: ['email', 'password']
      };
      const error = new ValidationError('Validation failed', details);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });
  });

  describe('Error Handler', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('handles AppError correctly', async () => {
      const error = new AppError(404, 'Not Found', 'notFound');
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      const responseData = await response.json();
      expect(responseData.statusCode).toBe(404);
      expect(responseData.message).toBe('Not Found');
      expect(responseData.type).toBe('notFound');
    });

    test('strips stack trace in production', async () => {
      process.env.NODE_ENV = 'production';
      const error = new AppError(500, 'Server Error', 'server');
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      const responseData = await response.json();
      expect(responseData.stack).toBeUndefined();
    });

    test('includes request ID in response', async () => {
      const error = new AppError(400, 'Bad Request', 'validation');
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, {
        request: mockRequest,
        requestId: 'test-123'
      });
      const responseData = await response.json();
      expect(responseData.requestId).toBe('test-123');
    });

    test('includes error details in development', async () => {
      process.env.NODE_ENV = 'development';
      const details = { email: 'test@example.com', errorCode: 'auth/invalid-credentials' };
      const error = new AuthError('Unauthorized', details);
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      const responseData = await response.json();
      expect(responseData.details).toEqual(details);
    });

    test('strips sensitive details in production', async () => {
      process.env.NODE_ENV = 'production';
      const details = { email: 'test@example.com', errorCode: 'auth/invalid-credentials' };
      const error = new AuthError('Unauthorized', details);
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      const responseData = await response.json();
      expect(responseData.details).toBeUndefined();
    });
  });

  describe('Error Handler Core Functionality', () => {
    let originalEnv: string | undefined;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
      consoleSpy = jest.spyOn(console, 'error');
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });

    test('maintains consistent error response format', async () => {
      const error = new ValidationError('Test error', { field: 'test' });
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      const responseData = await response.json();
      
      expect(responseData).toMatchObject({
        statusCode: expect.any(Number),
        message: expect.any(String),
        type: expect.any(String),
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });
    });

    test('logs errors in development environment', async () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      const mockRequest = new Request('http://localhost');
      
      handleError(error, { request: mockRequest });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test error'));
    });

    test('does not log sensitive details in production', async () => {
      process.env.NODE_ENV = 'production';
      const error = new AuthError('Test error', { 
        email: 'test@example.com',
        password: 'secret'
      });
      const mockRequest = new Request('http://localhost');
      
      const response = handleError(error, { request: mockRequest });
      const responseData = await response.json();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(responseData.details).toBeUndefined();
      expect(responseData.message).not.toContain('secret');
    });

    test('includes request context in error response', async () => {
      const error = new Error('Test error');
      const mockRequest = new Request('http://localhost', {
        headers: {
          'x-request-id': '12345',
          'user-agent': 'test-agent'
        }
      });
      
      const response = handleError(error, { 
        request: mockRequest,
        cookies: {
          get: jest.fn().mockImplementation(() => ({
            value: 'test-cookie',
            json: jest.fn()
          })),
          delete: jest.fn(),
          has: jest.fn(),
          set: jest.fn(),
          getAll: jest.fn(),
          [Symbol.iterator]: jest.fn(),
          merge: jest.fn(),
          headers: new Headers()
        } as unknown as AstroCookies
      });
      
      const responseData = await response.json();
      expect(responseData.requestId).toBe('12345');
      expect(responseData.userAgent).toBe('test-agent');
    });

    test('handles error chaining and aggregation', async () => {
      const originalError = new Error('Database connection failed');
      const wrappedError = new DatabaseError('Failed to fetch user data', {
        cause: originalError,
        userId: '123',
        operation: 'select'
      });
      
      const mockRequest = new Request('http://localhost');
      const response = handleError(wrappedError, { request: mockRequest });
      const responseData = await response.json();
      
      expect(responseData.message).toBe('Failed to fetch user data');
      expect(responseData.details).toMatchObject({
        userId: '123',
        operation: 'select'
      });
      expect(responseData.cause).toBeDefined();
    });

    test('logs detailed error information in development', async () => {
      process.env.NODE_ENV = 'development';
      const error = new ValidationError('Invalid input', { field: 'email' });
      const mockRequest = new Request('http://localhost');
      handleError(error, { request: mockRequest, requestId: 'dev-123' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Error] Invalid input - Details: {"stack":'),
        expect.anything() // Match any additional arguments
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"details":{"field":"email"}'),
        expect.anything()
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('"requestId":"dev-123"'),
        expect.anything()
      );
    });

    test('logs operational error details in production', async () => {
      process.env.NODE_ENV = 'production';
      const error = new AuthError('Authentication failed', { userId: 'user123' });
      const mockRequest = new Request('http://localhost');
      handleError(error, { request: mockRequest, requestId: 'prod-456' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Operational Error] Authentication failed'),
        expect.objectContaining({
          requestId: 'prod-456',
          type: 'auth',
          cause: undefined,
        })
      );
    });

    test('logs generic message for non-operational errors in production', async () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Unexpected error');
      const mockRequest = new Request('http://localhost');
      handleError(error, { request: mockRequest, requestId: 'prod-789' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Error]'),
        expect.objectContaining({
          message: 'Unexpected error',
          requestId: 'prod-789',
        })
      );
    });

    test('sanitizes sensitive details in production response', async () => {
      process.env.NODE_ENV = 'production';
      const error = new AuthError('Authentication failed', {
        userId: 'user123',
        password: 'secretPassword',
        email: 'test@example.com',
        token: 'sensitiveToken',
      });
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      const responseData = await response.json();

      expect(consoleSpy).toHaveBeenCalled();
      expect(responseData.details).toBeUndefined();
      expect(responseData.message).not.toContain('secretPassword');
      expect(responseData.message).not.toContain('test@example.com');
      expect(responseData.message).not.toContain('sensitiveToken');
      expect(responseData.stack).toBeUndefined();
    });

    test('maintains consistent error response format across environments', async () => {
      const error = new FileError('File upload failed', { filePath: 'test.txt' });
      const mockRequest = new Request('http://localhost');
      
      // Test in development
      process.env.NODE_ENV = 'development';
      const devResponse = handleError(error, { request: mockRequest });
      const devData = await devResponse.json();
      
      // Test in production
      process.env.NODE_ENV = 'production';
      const prodResponse = handleError(error, { request: mockRequest });
      const prodData = await prodResponse.json();
      
      // Common fields
      expect(devData).toMatchObject({
        statusCode: expect.any(Number),
        message: expect.any(String),
        type: expect.any(String),
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });
      
      expect(prodData).toMatchObject({
        statusCode: expect.any(Number),
        message: expect.any(String),
        type: expect.any(String),
        timestamp: expect.any(String),
        requestId: expect.any(String)
      });
      
      // Environment-specific differences
      expect(devData.details).toBeDefined();
      expect(prodData.details).toBeUndefined();
      expect(devData.stack).toBeDefined();
      expect(prodData.stack).toBeUndefined();
    });

    test('includes file-specific details in development', async () => {
      process.env.NODE_ENV = 'development';
      const error = new FileError('File operation failed', {
        filePath: 'test.txt',
        fileSize: 1024,
        operation: 'upload'
      });
      const mockRequest = new Request('http://localhost');
      
      const response = handleError(error, { request: mockRequest });
      const responseData = await response.json();
      
      expect(responseData.details).toEqual({
        filePath: 'test.txt',
        fileSize: 1024,
        operation: 'upload'
      });
      expect(responseData.stack).toBeDefined();
    });

    test('handles non-Error cause in error details', async () => {
      const error = new DatabaseError('Failed to update record', {
        cause: 'Invalid input data',
        recordId: 'rec123',
      });
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      const responseData = await response.json();

      expect(responseData.cause).toBe('Invalid input data');
    });
  });

  describe('API Error Handler', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('handles AppError correctly in API context', async () => {
      const error = new AppError(400, 'Bad Request', 'validation');
      const mockRequest = new Request('http://localhost');
      const response = apiErrorHandler(error, { request: mockRequest });
      const responseData = await response.json();

      expect(responseData.statusCode).toBe(400);
      expect(responseData.message).toBe('Bad Request');
      expect(responseData.type).toBe('validation');
    });

    test('differentiates between production and development in API context', async () => {
      process.env.NODE_ENV = 'production';
      const error = new AppError(500, 'Server Error', 'server');
      const mockRequest = new Request('http://localhost');
      const response = apiErrorHandler(error, { request: mockRequest });
      const responseData = await response.json();

      expect(responseData.stack).toBeUndefined();

      process.env.NODE_ENV = 'development';
      const devResponse = apiErrorHandler(error, { request: mockRequest });
      const devResponseData = await devResponse.json();

      expect(devResponseData.stack).toBeDefined();
    });
  });
});