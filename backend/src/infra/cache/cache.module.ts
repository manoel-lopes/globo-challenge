import Redis from 'ioredis'
import { Global, Module } from '@nestjs/common'
import { EnvService } from '@/infra/env/env.service'

export const REDIS_CLIENT = Symbol('REDIS_CLIENT')

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (envService: EnvService) => {
        return new Redis({
          host: envService.get('REDIS_HOST'),
          port: envService.get('REDIS_PORT'),
          db: envService.get('REDIS_DB'),
        })
      },
      inject: [EnvService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class CacheModule {}
