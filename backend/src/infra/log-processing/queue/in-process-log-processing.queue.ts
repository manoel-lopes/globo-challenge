import { Injectable, Logger } from '@nestjs/common'
import {
  type LogProcessingJob,
  LogProcessingQueue,
} from '@/domain/application/queues/log-processing.queue'
import { ProcessLogFileUseCase } from '@/domain/application/usecases/process-log-file/process-log-file.usecase'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class InProcessLogProcessingQueue implements LogProcessingQueue {
  private readonly logger = new Logger(InProcessLogProcessingQueue.name)
  private readonly inFlight = new Set<string>()
  private readonly pending: LogProcessingJob[] = []
  private activeCount = 0
  private readonly concurrency: number

  constructor (
    private readonly processLogFileUseCase: ProcessLogFileUseCase,
    envService?: EnvService
  ) {
    this.concurrency = Math.max(1, envService?.get('LOG_QUEUE_CONCURRENCY') ?? 1)
  }

  async enqueue (job: LogProcessingJob): Promise<void> {
    if (this.inFlight.has(job.logFileId)) {
      this.logger.warn(
        `Skipping duplicate in-process enqueue for log file ${job.logFileId}`
      )
      return
    }
    this.inFlight.add(job.logFileId)
    this.pending.push(job)
    setImmediate(() => {
      this.drain().catch((error: unknown) => {
        this.logger.error(
          'In-process queue drain failed',
          error instanceof Error ? error.stack : undefined
        )
      })
    })
  }

  private async drain (): Promise<void> {
    while (this.activeCount < this.concurrency && this.pending.length > 0) {
      const job = this.pending.shift()
      if (!job) return
      this.activeCount += 1
      this.runJob(job).then(
        () => undefined,
        () => undefined
      )
    }
  }

  private async runJob (job: LogProcessingJob): Promise<void> {
    try {
      await this.processLogFileUseCase.execute({
        logFileId: job.logFileId,
        filePath: job.filePath,
      })
    } catch (error: unknown) {
      this.logger.error(
        `In-process processing failed for log file ${job.logFileId}`,
        error instanceof Error ? error.stack : undefined
      )
    } finally {
      this.inFlight.delete(job.logFileId)
      this.activeCount -= 1
      await this.drain()
    }
  }
}
