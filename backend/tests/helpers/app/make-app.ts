import multipart from '@fastify/multipart'
import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import type { Env } from '@/infra/env/env'
import { EnvService } from '@/infra/env/env.service'
import { AllExceptionsFilter } from '@/infra/http/presentation/filters/all-exceptions.filter'
import { AppModule } from '@/app.module'

type MakeAppOptions = {
  maxUploadSize?: number
  logSyncMaxBytes?: number
  logQueueDriver?: Env['LOG_QUEUE_DRIVER']
}

export async function makeApp (options: MakeAppOptions = {}): Promise<INestApplication> {
  const moduleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })
  if (
    options.maxUploadSize !== undefined ||
    options.logSyncMaxBytes !== undefined ||
    options.logQueueDriver !== undefined
  ) {
    const overrides: Partial<Env> = {}
    if (options.maxUploadSize !== undefined) overrides.MAX_UPLOAD_SIZE = options.maxUploadSize
    if (options.logSyncMaxBytes !== undefined) overrides.LOG_SYNC_MAX_BYTES = options.logSyncMaxBytes
    if (options.logQueueDriver !== undefined) overrides.LOG_QUEUE_DRIVER = options.logQueueDriver
    moduleBuilder.overrideProvider(EnvService).useFactory({
      factory: (configService: ConfigService<Env, true>) => {
        const envService = new EnvService(configService)
        return {
          get: <T extends keyof Env>(key: T): Env[T] => overrides[key] ?? envService.get(key),
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
