import { AppError, ValidationError, AuthError, DatabaseError, FileError, handleError } from '../src/utils/errorHandler';

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
  });

  describe('Error Handler', () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env.NODE_ENV;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('handles AppError correctly', () => {
      const error = new AppError(404, 'Not Found', 'notFound');
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('Not Found');
      expect(response.type).toBe('notFound');
      expect(response.error).toBeDefined();
    });

    test('strips stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new AppError(500, 'Server Error', 'server');
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      expect(response.stack).toBeUndefined();
    });
test('includes request ID in response', () => {
  const error = new AppError(400, 'Bad Request', 'validation');
  const mockRequest = new Request('http://localhost');
  const responseWithId = handleError(error, {
    request: mockRequest,
    requestId: 'test-123'
  });
      expect(responseWithId.requestId).toBe('test-123');
    });

    test('handles unknown errors with 500 status', () => {
      const error = new Error('Unknown error');
      const mockRequest = new Request('http://localhost');
      const response = handleError(error, { request: mockRequest });
      expect(response.statusCode).toBe(500);
      expect(response.type).toBe('server');
    });
  });
});