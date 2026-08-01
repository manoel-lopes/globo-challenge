import { type Job, Worker } from 'bullmq'
import Redis from 'ioredis'
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { LogProcessingJob } from '@/domain/application/queues/log-processing.queue'
import { ProcessLogFileUseCase } from '@/domain/application/usecases/process-log-file/process-log-file.usecase'
import { EnvService } from '@/infra/env/env.service'
import { LOG_PROCESSING_QUEUE_NAME } from './log-processing.queue-name'

@Injectable()
export class LogProcessingWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LogProcessingWorker.name)
  private worker: Worker | null = null
  private connection: Redis | null = null

  constructor (
    private readonly envService: EnvService,
    private readonly processLogFileUseCase: ProcessLogFileUseCase
  ) {}

  onModuleInit (): void {
    const attempts = this.envService.get('LOG_QUEUE_ATTEMPTS')
    this.connection = new Redis({
      host: this.envService.get('REDIS_HOST'),
      port: this.envService.get('REDIS_PORT'),
      db: this.envService.get('REDIS_DB'),
      maxRetriesPerRequest: null,
    })
    this.worker = new Worker(
      LOG_PROCESSING_QUEUE_NAME,
      async (job: Job<LogProcessingJob>) => {
        const retainFileOnFailure = job.attemptsMade + 1 < attempts
        await this.processLogFileUseCase.execute({
          logFileId: job.data.logFileId,
          filePath: job.data.filePath,
          retainFileOnFailure,
        })
      },
      {
        connection: this.connection,
        concurrency: this.envService.get('LOG_QUEUE_CONCURRENCY'),
      }
    )
    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `BullMQ job failed for log file ${job?.data.logFileId ?? 'unknown'}: ${error.message}`,
        error.stack
      )
    })
    this.logger.log('BullMQ log-processing worker started')
  }

  async onModuleDestroy (): Promise<void> {
    if (this.worker) {
      await this.worker.close()
      this.worker = null
    }
    if (this.connection) {
      await this.connection.quit()
      this.connection = null
    }
  }
}
