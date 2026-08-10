import { Logger, Module } from '@nestjs/common'
import { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import { ProcessLogFileUseCase } from '@/domain/application/usecases/process-log-file/process-log-file.usecase'
import { NestAppLogger } from '@/infra/adapters/nest-app-logger.adapter'
import { LogProcessingModule } from '@/infra/log-processing/log-processing.module'
import { RepositoriesModule } from '@/infra/persistence/repositories/repositories.module'
import { LogFileParser } from '../log-processing/log-file/log-file.parser'

@Module({
  imports: [RepositoriesModule, LogProcessingModule],
  providers: [
    {
      provide: LogFileParser,
      useExisting: LogFileParser,
    },
    {
      provide: ProcessLogFileUseCase,
      useFactory: (
        logFilesRepository: LogFilesRepository,
        logEntriesRepository: LogEntriesRepository,
        fileProcessor: LogFileParser
      ) => new ProcessLogFileUseCase(
        logFilesRepository,
        logEntriesRepository,
        fileProcessor,
        new NestAppLogger(new Logger(ProcessLogFileUseCase.name))
      ),
      inject: [LogFilesRepository, LogEntriesRepository, LogFileParser],
    },
  ],
  exports: [ProcessLogFileUseCase, LogFileParser],
})
export class ProcessLogFileModule {}
