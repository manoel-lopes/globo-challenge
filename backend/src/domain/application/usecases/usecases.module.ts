import { Global, Module } from '@nestjs/common'
import { LogProcessingModule } from '@/infra/log-processing/log-processing.module'
import { RepositoriesModule } from '@/infra/persistence/repositories/repositories.module'
import { GetDashboardSummaryUseCase } from './get-dashboard-summary/get-dashboard-summary.usecase'
import { GetDashboardTopSourcesUseCase } from './get-dashboard-top-sources/get-dashboard-top-sources.usecase'
import { GetDashboardTrendsUseCase } from './get-dashboard-trends/get-dashboard-trends.usecase'
import { GetLogEntryByIdUseCase } from './get-log-entry-by-id/get-log-entry-by-id.usecase'
import { GetLogFileByIdUseCase } from './get-log-file-by-id/get-log-file-by-id.usecase'
import { ImportLogFileUseCase } from './import-log-file/import-log-file.usecase'
import { ListLogEntriesUseCase } from './list-log-entries/list-log-entries.usecase'
import { ListLogFilesUseCase } from './list-log-files/list-log-files.usecase'
import { ProcessLogFileUseCase } from './process-log-file/process-log-file.usecase'

@Global()
@Module({
  imports: [RepositoriesModule, LogProcessingModule],
  providers: [
    ProcessLogFileUseCase,
    ImportLogFileUseCase,
    GetLogFileByIdUseCase,
    ListLogFilesUseCase,
    ListLogEntriesUseCase,
    GetLogEntryByIdUseCase,
    GetDashboardSummaryUseCase,
    GetDashboardTrendsUseCase,
    GetDashboardTopSourcesUseCase,
  ],
  exports: [
    ProcessLogFileUseCase,
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
