import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Env } from './env'

@Injectable()
export class EnvService {
  constructor (private configService: ConfigService<Env, true>) {}

  get<T extends keyof Env> (key: T): Env[T] {
    return this.configService.get(key, { infer: true })
  }

  getDatabaseUrl () {
    const dbUser = this.configService.get('DB_USER', { infer: true })
    const dbPassword = this.configService.get('DB_PASSWORD', { infer: true })
    const dbHost = this.configService.get('DB_HOST', { infer: true })
    const dbPort = this.configService.get('DB_PORT', { infer: true })
    const dbName = this.configService.get('DB_NAME', { infer: true })
    return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`
  }
}
