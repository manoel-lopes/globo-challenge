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

  protected deleteCacheByPattern (pattern: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const stream = this.redis.scanStream({ match: pattern, count: 100 })
      const pipeline = this.redis.pipeline()
      let queued = 0
      stream.on('data', (keys: string[]) => {
        for (const key of keys) {
          pipeline.del(key)
          queued += 1
        }
      })
      stream.on('error', reject)
      stream.on('end', () => {
        if (queued === 0) {
          resolve()
          return
        }
        pipeline.exec().then(() => resolve()).catch(reject)
      })
    })
  }
}
