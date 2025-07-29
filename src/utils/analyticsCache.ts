/**
 * Simple in-memory cache for analytics operations
 * Helps improve performance by caching expensive calculations
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Generate cache key from survey ID and options
   */
  private generateKey(surveyId: string, operation: string, options?: any): string {
    const optionsHash = options ? JSON.stringify(options) : '';
    return `${surveyId}:${operation}:${this.hashString(optionsHash)}`;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Ensure cache doesn't exceed maximum size
   */
  private enforceMaxSize(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE + 10);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Get cached data
   */
  get<T>(surveyId: string, operation: string, options?: any): T | null {
    this.cleanup();
    
    const key = this.generateKey(surveyId, operation, options);
    const entry = this.cache.get(key);
    
    if (entry && this.isValid(entry)) {
      console.log(`Cache hit for ${operation} on survey ${surveyId}`);
      return entry.data as T;
    }
    
    if (entry) {
      // Entry exists but is expired
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * Set cached data
   */
  set<T>(surveyId: string, operation: string, data: T, options?: any, ttl?: number): void {
    this.cleanup();
    this.enforceMaxSize();
    
    const key = this.generateKey(surveyId, operation, options);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    };
    
    this.cache.set(key, entry);
    console.log(`Cached ${operation} for survey ${surveyId}`);
  }

  /**
   * Invalidate cache for a specific survey
   */
  invalidateSurvey(surveyId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${surveyId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Invalidated cache for survey ${surveyId}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('Analytics cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; entries: string[] } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Cached wrapper for expensive operations
   */
  async cached<T>(
    surveyId: string,
    operation: string,
    fn: () => Promise<T>,
    options?: any,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(surveyId, operation, options);
    if (cached !== null) {
      return cached;
    }

    // Execute the function and cache the result
    console.log(`Cache miss for ${operation} on survey ${surveyId}, executing...`);
    const result = await fn();
    this.set(surveyId, operation, result, options, ttl);
    
    return result;
  }
}

// Export singleton instance
export const analyticsCache = new AnalyticsCache();

/**
 * Decorator for caching analytics functions
 */
export function withCache<T extends any[], R>(
  operation: string,
  ttl?: number
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = async function (...args: T): Promise<R> {
      // Assume first argument is survey data with ID
      const surveyId = (args[0] as any)?.id || (args[0] as any)?.[0]?.survey_id || 'unknown';
      const cacheKey = `${propertyName}:${JSON.stringify(args.slice(1))}`;
      
      return analyticsCache.cached(
        surveyId,
        operation,
        () => method.apply(this, args),
        cacheKey,
        ttl
      );
    };
  };
}

/**
 * Cache warming utility for preloading common analytics
 */
export async function warmAnalyticsCache(surveyId: string, data: any[]): Promise<void> {
  console.log(`Warming analytics cache for survey ${surveyId}`);
  
  // Pre-calculate common analytics operations
  const operations = [
    { name: 'correlation', fn: () => processCorrelationAnalysis(data) },
    { name: 'success_trends', fn: () => processSuccessTrends(data) },
    { name: 'error_patterns', fn: () => processErrorPatterns(data) }
  ];

  await Promise.all(
    operations.map(async ({ name, fn }) => {
      try {
        const result = await fn();
        analyticsCache.set(surveyId, name, result, {}, 10 * 60 * 1000); // 10 minutes
      } catch (error) {
        console.warn(`Failed to warm cache for ${name}:`, error);
      }
    })
  );
}

// Placeholder functions for cache warming (would be implemented with real analytics)
async function processCorrelationAnalysis(data: any[]): Promise<any> {
  // Simulate expensive correlation calculation
  await new Promise(resolve => setTimeout(resolve, 100));
  return { correlations: [], processed: data.length };
}

async function processSuccessTrends(data: any[]): Promise<any> {
  // Simulate expensive trend analysis
  await new Promise(resolve => setTimeout(resolve, 100));
  return { trends: [], processed: data.length };
}

async function processErrorPatterns(data: any[]): Promise<any> {
  // Simulate expensive error analysis
  await new Promise(resolve => setTimeout(resolve, 100));
  return { patterns: [], processed: data.length };
}