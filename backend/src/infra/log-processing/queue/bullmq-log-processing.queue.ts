import { Queue } from 'bullmq'
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import {
  type LogProcessingJob,
  LogProcessingQueue,
} from '@/domain/application/queues/log-processing.queue'
import { LogProcessingUnavailableError } from '@/domain/application/usecases/import-log-file/errors/log-processing-unavailable.error'
import { EnvService } from '@/infra/env/env.service'
import { LOG_PROCESSING_QUEUE_NAME } from './log-processing.queue-name'

@Injectable()
export class BullMqLogProcessingQueue implements LogProcessingQueue, OnModuleDestroy {
  private readonly logger = new Logger(BullMqLogProcessingQueue.name)
  private readonly queue: Queue

  constructor (private readonly envService: EnvService) {
    this.queue = new Queue(LOG_PROCESSING_QUEUE_NAME, {
      connection: {
        host: this.envService.get('REDIS_HOST'),
        port: this.envService.get('REDIS_PORT'),
        db: this.envService.get('REDIS_DB'),
      },
      defaultJobOptions: {
        attempts: this.envService.get('LOG_QUEUE_ATTEMPTS'),
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    })
  }

  async enqueue (job: LogProcessingJob): Promise<void> {
    try {
      await this.queue.add(
        'process-log-file',
        { logFileId: job.logFileId, filePath: job.filePath },
        { jobId: job.logFileId }
      )
    } catch (error) {
      this.logger.error(
        `Failed to enqueue log file ${job.logFileId}`,
        error instanceof Error ? error.stack : undefined
      )
      throw new LogProcessingUnavailableError(error)
    }
  }

  async onModuleDestroy (): Promise<void> {
    await this.queue.close()
  }
}
