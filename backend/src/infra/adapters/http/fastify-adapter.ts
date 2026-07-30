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
  }
}
