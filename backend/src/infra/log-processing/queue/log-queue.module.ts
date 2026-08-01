import { Module } from '@nestjs/common'
import { LogProcessingQueue } from '@/domain/application/queues/log-processing.queue'
import { ProcessLogFileModule } from '@/infra/application/process-log-file.module'
import { EnvService } from '@/infra/env/env.service'
import { BullMqLogProcessingQueue } from './bullmq-log-processing.queue'
import { InProcessLogProcessingQueue } from './in-process-log-processing.queue'
import { LogProcessingWorker } from './log-processing.worker'

@Module({
  imports: [ProcessLogFileModule],
  providers: [
    InProcessLogProcessingQueue,
    BullMqLogProcessingQueue,
    LogProcessingWorker,
    {
      provide: LogProcessingQueue,
      useFactory: (
        envService: EnvService,
        inlineQueue: InProcessLogProcessingQueue,
        bullmqQueue: BullMqLogProcessingQueue
      ) => {
        const drivers: Record<'inline' | 'bullmq', LogProcessingQueue> = {
          inline: inlineQueue,
          bullmq: bullmqQueue,
        }
        return drivers[envService.get('LOG_QUEUE_DRIVER')]
      },
      inject: [EnvService, InProcessLogProcessingQueue, BullMqLogProcessingQueue],
    },
  ],
  exports: [LogProcessingQueue],
})
export class LogQueueModule {}
