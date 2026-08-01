import multipart from '@fastify/multipart'
import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { AppModule } from '@/app.module'
import type { Env } from '@/infra/env/env'
import { EnvService } from '@/infra/env/env.service'
import { AllExceptionsFilter } from '@/infra/http/presentation/filters/all-exceptions.filter'

type MakeAppOptions = {
  maxUploadSize?: number
  logSyncMaxBytes?: number
}

export async function makeApp (options: MakeAppOptions = {}): Promise<INestApplication> {
  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
  if (options.maxUploadSize !== undefined || options.logSyncMaxBytes !== undefined) {
    const maxUploadSize = options.maxUploadSize
    const logSyncMaxBytes = options.logSyncMaxBytes
    moduleBuilder.overrideProvider(EnvService).useFactory({
      factory: (configService: ConfigService<Env, true>) => {
        const envService = new EnvService(configService)
        return {
          get: <T extends keyof Env>(key: T): Env[T] => {
            if (key === 'MAX_UPLOAD_SIZE' && maxUploadSize !== undefined) {
              return maxUploadSize as Env[T]
            }
            if (key === 'LOG_SYNC_MAX_BYTES' && logSyncMaxBytes !== undefined) {
              return logSyncMaxBytes as Env[T]
            }
            return envService.get(key)
          },
          getDatabaseUrl: () => envService.getDatabaseUrl(),
        }
      },
      inject: [ConfigService],
    })
  }
  const moduleRef = await moduleBuilder.compile()
  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({ logger: false }),
    { logger: false }
  )
  app.useGlobalFilters(new AllExceptionsFilter())
  app.enableShutdownHooks()
  const envService = app.get(EnvService)
  // @ts-expect-error Fastify multipart register type mismatch
  await app.register(multipart, {
    limits: {
      fileSize: envService.get('MAX_UPLOAD_SIZE'),
      files: 1,
    },
  })
  await app.init()
  await app.getHttpAdapter().getInstance().ready()
  return app
}
