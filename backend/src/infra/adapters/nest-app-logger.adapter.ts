import { Logger } from '@nestjs/common'
import type { AppLogger } from '@/domain/application/ports/app-logger.port'

export class NestAppLogger implements AppLogger {
  constructor (private readonly logger: Logger) {}

  log (message: string): void {
    this.logger.log(message)
  }

  error (message: string): void {
    this.logger.error(message)
  }
}
