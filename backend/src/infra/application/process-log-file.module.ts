import { Logger, Module } from '@nestjs/common'
import { LogFileProcessorPort } from '@/domain/application/ports/log-file-processor.port'
import { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import { ProcessLogFileUseCase } from '@/domain/application/usecases/process-log-file/process-log-file.usecase'
import { NestAppLogger } from '@/infra/adapters/nest-app-logger.adapter'
import { LogFileParser } from '@/infra/log-processing/log-file.parser'
import { LogProcessingModule } from '@/infra/log-processing/log-processing.module'
import { RepositoriesModule } from '@/infra/persistence/repositories/repositories.module'

@Module({
  imports: [RepositoriesModule, LogProcessingModule],
  providers: [
    {
      provide: LogFileProcessorPort,
      useExisting: LogFileParser,
    },
    {
      provide: ProcessLogFileUseCase,
      useFactory: (
        logFilesRepository: LogFilesRepository,
        logEntriesRepository: LogEntriesRepository,
        fileProcessor: LogFileProcessorPort
      ) => new ProcessLogFileUseCase(
        logFilesRepository,
        logEntriesRepository,
        fileProcessor,
        new NestAppLogger(new Logger(ProcessLogFileUseCase.name))
      ),
      inject: [LogFilesRepository, LogEntriesRepository, LogFileProcessorPort],
    },
  ],
  exports: [ProcessLogFileUseCase, LogFileProcessorPort],
})
export class ProcessLogFileModule {}
