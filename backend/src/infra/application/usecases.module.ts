import { Global, Module } from '@nestjs/common'
import { LogFileProcessorPort } from '@/domain/application/ports/log-file-processor.port'
import { LogProcessingQueue } from '@/domain/application/queues/log-processing.queue'
import { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import { GetDashboardSummaryUseCase } from '@/domain/application/usecases/get-dashboard-summary/get-dashboard-summary.usecase'
import { GetDashboardTopSourcesUseCase } from '@/domain/application/usecases/get-dashboard-top-sources/get-dashboard-top-sources.usecase'
import { GetDashboardTrendsUseCase } from '@/domain/application/usecases/get-dashboard-trends/get-dashboard-trends.usecase'
import { GetLogEntryByIdUseCase } from '@/domain/application/usecases/get-log-entry-by-id/get-log-entry-by-id.usecase'
import { GetLogFileByIdUseCase } from '@/domain/application/usecases/get-log-file-by-id/get-log-file-by-id.usecase'
import { ImportLogFileUseCase } from '@/domain/application/usecases/import-log-file/import-log-file.usecase'
import { ListLogEntriesUseCase } from '@/domain/application/usecases/list-log-entries/list-log-entries.usecase'
import { ListLogFilesUseCase } from '@/domain/application/usecases/list-log-files/list-log-files.usecase'
import { ProcessLogFileUseCase } from '@/domain/application/usecases/process-log-file/process-log-file.usecase'
import { ProcessLogFileModule } from '@/infra/application/process-log-file.module'
import { LogQueueModule } from '@/infra/log-processing/queue/log-queue.module'
import { RepositoriesModule } from '@/infra/persistence/repositories/repositories.module'

@Global()
@Module({
  imports: [RepositoriesModule, ProcessLogFileModule, LogQueueModule],
  providers: [
    {
      provide: ImportLogFileUseCase,
      useFactory: (
        logFilesRepository: LogFilesRepository,
        fileProcessor: LogFileProcessorPort,
        processLogFileUseCase: ProcessLogFileUseCase,
        logProcessingQueue: LogProcessingQueue
      ) => new ImportLogFileUseCase(
        logFilesRepository,
        fileProcessor,
        processLogFileUseCase,
        logProcessingQueue
      ),
      inject: [
        LogFilesRepository,
        LogFileProcessorPort,
        ProcessLogFileUseCase,
        LogProcessingQueue,
      ],
    },
    {
      provide: GetLogFileByIdUseCase,
      useFactory: (logFilesRepository: LogFilesRepository) =>
        new GetLogFileByIdUseCase(logFilesRepository),
      inject: [LogFilesRepository],
    },
    {
      provide: ListLogFilesUseCase,
      useFactory: (logFilesRepository: LogFilesRepository) =>
        new ListLogFilesUseCase(logFilesRepository),
      inject: [LogFilesRepository],
    },
    {
      provide: ListLogEntriesUseCase,
      useFactory: (logEntriesRepository: LogEntriesRepository) =>
        new ListLogEntriesUseCase(logEntriesRepository),
      inject: [LogEntriesRepository],
    },
    {
      provide: GetLogEntryByIdUseCase,
      useFactory: (logEntriesRepository: LogEntriesRepository) =>
        new GetLogEntryByIdUseCase(logEntriesRepository),
      inject: [LogEntriesRepository],
    },
    {
      provide: GetDashboardSummaryUseCase,
      useFactory: (logEntriesRepository: LogEntriesRepository) =>
        new GetDashboardSummaryUseCase(logEntriesRepository),
      inject: [LogEntriesRepository],
    },
    {
      provide: GetDashboardTrendsUseCase,
      useFactory: (logEntriesRepository: LogEntriesRepository) =>
        new GetDashboardTrendsUseCase(logEntriesRepository),
      inject: [LogEntriesRepository],
    },
    {
      provide: GetDashboardTopSourcesUseCase,
      useFactory: (logEntriesRepository: LogEntriesRepository) =>
        new GetDashboardTopSourcesUseCase(logEntriesRepository),
      inject: [LogEntriesRepository],
    },
  ],
  exports: [
    ProcessLogFileModule,
    ImportLogFileUseCase,
    GetLogFileByIdUseCase,
    ListLogFilesUseCase,
    ListLogEntriesUseCase,
    GetLogEntryByIdUseCase,
    GetDashboardSummaryUseCase,
    GetDashboardTrendsUseCase,
    GetDashboardTopSourcesUseCase,
  ],
})
export class UseCasesModule {}
