import multipart from '@fastify/multipart'
import type { INestApplication } from '@nestjs/common'
import { FastifyAdapter as NestFastifyAdapter } from '@nestjs/platform-fastify'
import { Env } from '@/infra/env/env'
import { EnvService } from '@/infra/env/env.service'

type LogLevels = 'silent' | 'info' | 'error'

export class FastifyAdapter extends NestFastifyAdapter {
  constructor () {
    super({ logger: false })
  }

  async configure (app: INestApplication): Promise<void> {
    const envService = app.get(EnvService)
    const nodeEnv = envService.get('NODE_ENV')
    if (nodeEnv !== 'development') {
      app.useLogger(false)
    }
    const logLevels: Record<Env['NODE_ENV'], LogLevels> = {
      test: 'silent',
      development: 'info',
      production: 'error',
    }
    this.getInstance().log.level = logLevels[nodeEnv]
    // Multipart plugin types are incompatible across nested fastify versions.
    // @ts-expect-error Fastify multipart register type mismatch
    await this.getInstance().register(multipart, {
      limits: {
        fileSize: envService.get('MAX_UPLOAD_SIZE'),
        files: 1,
      },
    })
  }
}
