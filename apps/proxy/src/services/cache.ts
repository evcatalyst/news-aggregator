import { config } from '../config/env';

class Cache<T> {
  private data: Map<string, { timestamp: number; value: T }>;
  private maxAge: number;

  constructor(maxAge: number = config.cacheMaxAge) {
    this.data = new Map();
    this.maxAge = maxAge;
  }

  set(key: string, value: T): void {
    console.log(`[Cache] Setting cache for key: ${key}`);
    this.data.set(key, {
      timestamp: Date.now(),
      value,
    });
  }

  get(key: string): T | null {
    const entry = this.data.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.maxAge) {
      console.log(`[Cache] Expired cache for key: ${key}`);
      this.data.delete(key);
      return null;
    }

    console.log(`[Cache] Cache hit for key: ${key}`);
    return entry.value;
  }

  clear(): void {
    this.data.clear();
  }
}

// Create and export cache instances for different types
export const newsCache = new Cache();
export const userCache = new Cache(30 * 60 * 1000); // 30 minutes for user data
