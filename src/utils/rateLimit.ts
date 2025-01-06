// src/utils/rateLimit.ts

type RateLimitConfig = {
  windowMs: number;
  maxAttempts: number;
}

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: Date | null;
}

// In-memory store for rate limiting
// In production, this should be replaced with Redis or similar
const rateLimitStore = new Map<string, { 
  attempts: number;
  lastReset: number;
}>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.lastReset > 24 * 60 * 60 * 1000) { // Clean up after 24 hours
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run cleanup every hour

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Authentication
  LOGIN: { windowMs: 15 * 60 * 1000, maxAttempts: 5 },     // 5 attempts per 15 minutes
  PASSWORD_RESET: { windowMs: 60 * 60 * 1000, maxAttempts: 3 }, // 3 attempts per hour
  CREATE_USER: { windowMs: 24 * 60 * 60 * 1000, maxAttempts: 10 }, // 10 new users per day
  
  // File Operations
  UPLOAD: { windowMs: 60 * 60 * 1000, maxAttempts: 50 },   // 50 uploads per hour
  DELETE: { windowMs: 60 * 60 * 1000, maxAttempts: 30 },   // 30 deletions per hour
  PROFILE_CREATE: { windowMs: 60 * 60 * 1000, maxAttempts: 20 }, // 20 profile creations per hour
  PROFILE_UPDATE: { windowMs: 60 * 60 * 1000, maxAttempts: 30 }, // 30 profile updates per hour
  
  // Public APIs
  CONTACT: { windowMs: 60 * 60 * 1000, maxAttempts: 5 },   // 5 contact emails per hour
  API: { windowMs: 60 * 1000, maxAttempts: 100 },           // 100 API calls per minute
  
  // Survey APIs
  SURVEY_CREATE: { windowMs: 60 * 60 * 1000, maxAttempts: 10 }, // 10 survey creations per hour
  SURVEY_RESPONSE: { windowMs: 15 * 60 * 1000, maxAttempts: 20 }, // 20 survey responses per 15 minutes
  SURVEY_RESULTS: { windowMs: 60 * 60 * 1000, maxAttempts: 50 }, // 50 results downloads per hour
} as const;

export class RateLimiter {
  /**
   * Check if an action should be rate limited
   * @param key Unique identifier (e.g., IP + endpoint or user ID + action)
   * @param config Rate limit configuration
   * @returns Result containing success status and remaining attempts
   */
  static check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    // No existing record
    if (!record) {
      rateLimitStore.set(key, {
        attempts: 1,
        lastReset: now
      });
      return {
        success: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now + config.windowMs)
      };
    }

    // Check if window has expired
    if (now - record.lastReset > config.windowMs) {
      record.attempts = 1;
      record.lastReset = now;
      rateLimitStore.set(key, record);
      return {
        success: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now + config.windowMs)
      };
    }

    // Within window, check attempts
    if (record.attempts >= config.maxAttempts) {
      return {
        success: false,
        remaining: 0,
        resetAt: new Date(record.lastReset + config.windowMs)
      };
    }

    // Increment attempts
    record.attempts++;
    rateLimitStore.set(key, record);

    return {
      success: true,
      remaining: config.maxAttempts - record.attempts,
      resetAt: new Date(record.lastReset + config.windowMs)
    };
  }

  /**
   * Helper function to get a unique key combining IP and endpoint
   */
  static getKey(ip: string, endpoint: string): string {
    return `${ip}:${endpoint}`;
  }

  /**
   * Helper function to generate rate limit headers
   */
  static getHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.resetAt ? result.resetAt.toISOString() : '',
      ...(result.success ? {} : { 'Retry-After': Math.ceil((result.resetAt!.getTime() - Date.now()) / 1000).toString() })
    };
  }
}

/**
 * Rate limiting middleware for API routes
 * @param endpoint The endpoint name (must match a RATE_LIMITS key)
 * @returns Middleware function that handles rate limiting
 */
export function rateLimitMiddleware(endpoint: keyof typeof RATE_LIMITS) {
  return async (request: Request) => {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Get client IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check rate limit
    const rateLimitKey = RateLimiter.getKey(clientIp, endpoint);
    const rateLimitResult = RateLimiter.check(rateLimitKey, RATE_LIMITS[endpoint]);

    // Add rate limit headers
    Object.assign(headers, RateLimiter.getHeaders(rateLimitResult));

    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many requests. Please try again later.'
      }), {
        status: 429,
        headers
      });
    }

    return { headers };
  };
}