// src/utils/rateLimit.ts

import { Redis } from 'ioredis';

interface NoOpStore extends RateLimitStore {
  get: () => Promise<null>;
  set: () => Promise<void>;
  delete: () => Promise<void>;
}

type RateLimitConfig = {
  windowMs: number;
  maxAttempts: number;
}

type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: Date | null;
}

interface RateLimitStore {
  get(key: string): Promise<RateLimitRecord | null>;
  set(key: string, record: RateLimitRecord): Promise<void>;
  delete(key: string): Promise<void>;
}

interface RateLimitRecord {
  attempts: number;
  lastReset: number;
}

class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitRecord>();
  
  async get(key: string): Promise<RateLimitRecord | null> {
    return this.store.get(key) || null;
  }
  
  async set(key: string, record: RateLimitRecord): Promise<void> {
    this.store.set(key, record);
  }
  
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class RedisStore implements RateLimitStore {
  constructor(private redis: Redis) {}
  
  async get(key: string): Promise<RateLimitRecord | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }
  
  async set(key: string, record: RateLimitRecord): Promise<void> {
    await this.redis.set(
      key,
      JSON.stringify(record),
      'EX',
      Math.ceil(record.lastReset / 1000)
    );
  }
  
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
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
  
  // New limits to add
  SOUND_DOWNLOAD: { windowMs: 60 * 60 * 1000, maxAttempts: 100 },
  SOUND_PLAYBACK: { windowMs: 60 * 1000, maxAttempts: 200 },
  PROFILE_VIEW: { windowMs: 60 * 1000, maxAttempts: 300 },
} as const;

export const RATE_LIMIT_CONFIG = {
  STORAGE_TYPE: process.env.RATE_LIMIT_STORAGE || 'memory',
  REDIS_URL: process.env.REDIS_URL,
  CLEANUP_INTERVAL: parseInt(process.env.RATE_LIMIT_CLEANUP_INTERVAL || '3600000'),
  ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false'
};

export class RateLimiter {
  private static instance: RateLimiter;
  constructor(
    private store: RateLimitStore,
    private readonly defaultConfig: RateLimitConfig = RATE_LIMITS.API
  ) {}

  static getInstance(store?: RateLimitStore): RateLimiter {
    if (!RateLimiter.instance) {
      let storeInstance: RateLimitStore;
      
      if (!RATE_LIMIT_CONFIG.ENABLED) {
        // Create a no-op store if rate limiting is disabled
        storeInstance = {
          get: async () => null,
          set: async () => {},
          delete: async () => {}
        };
      } else if (RATE_LIMIT_CONFIG.STORAGE_TYPE === 'redis' && RATE_LIMIT_CONFIG.REDIS_URL) {
        const redis = new Redis(RATE_LIMIT_CONFIG.REDIS_URL);
        storeInstance = new RedisStore(redis);
      } else {
        storeInstance = new MemoryStore();
      }
      
      RateLimiter.instance = new RateLimiter(store || storeInstance);
    }
    return RateLimiter.instance;
  }

  /**
   * Check if an action should be rate limited
   * @param key Unique identifier (e.g., IP + endpoint or user ID + action)
   * @param config Rate limit configuration
   * @returns Result containing success status and remaining attempts
   */
  async check(key: string, config: RateLimitConfig = this.defaultConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const record = await this.store.get(key);

    if (!record) {
      await this.store.set(key, {
        attempts: 1,
        lastReset: now
      });
      return {
        success: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now + config.windowMs)
      };
    }

    if (now - record.lastReset > config.windowMs) {
      await this.store.set(key, {
        attempts: 1,
        lastReset: now
      });
      return {
        success: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now + config.windowMs)
      };
    }

    if (record.attempts >= config.maxAttempts) {
      return {
        success: false,
        remaining: 0,
        resetAt: new Date(record.lastReset + config.windowMs)
      };
    }

    record.attempts++;
    await this.store.set(key, record);

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

interface KeyGeneratorOptions {
  includeMethod?: boolean;
  includeIP?: boolean;
  includeUser?: boolean;
  customKey?: string;
}

function generateKey(request: Request, options: KeyGeneratorOptions = {}): string {
  const parts: string[] = [];
  
  if (options.includeMethod) {
    parts.push(request.method);
  }
  
  if (options.includeIP) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';
    parts.push(ip);
  }
  
  if (options.includeUser) {
    // Get user ID from request context if available
    // const userId = getUserIdFromRequest(request);
    // if (userId) {
    //   parts.push(userId);
    // }
    parts.push('user-id'); // Placeholder for user ID
  }
  
  if (options.customKey) {
    parts.push(options.customKey);
  }
  
  return parts.join(':');
}

export function rateLimitMiddleware(
  endpoint: keyof typeof RATE_LIMITS,
  options: KeyGeneratorOptions = {}
) {
  return async (request: Request) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const key = generateKey(request, options);
    
    // Check rate limit
    const rateLimiter = RateLimiter.getInstance();
    const rateLimitResult = await rateLimiter.check(key, RATE_LIMITS[endpoint]);

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