import Redis from 'ioredis'

export abstract class BaseCachedRepository {
  constructor (protected readonly redis: Redis) {}

  protected async getFromCache<T> (key: string): Promise<T | null> {
    const cached = await this.redis.get(key)
    if (!cached) return null
    return JSON.parse(cached)
  }

  protected async setCache<T> (key: string, value: T, ttl: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl)
  }

  protected async deleteCache (key: string): Promise<void> {
    await this.redis.del(key)
  }

  protected async deleteCacheByPattern (pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
}
