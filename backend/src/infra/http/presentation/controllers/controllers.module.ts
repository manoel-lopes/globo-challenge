import { Module } from '@nestjs/common'
import { CreateLogFileController } from './create-log-file/create-log-file.controller'
import { DashboardController } from './dashboard/dashboard.controller'
import { GetLogEntryByIdController } from './get-log-entry-by-id/get-log-entry-by-id.controller'
import { GetLogFileByIdController } from './get-log-file-by-id/get-log-file-by-id.controller'
import { ListLogFilesController } from './list-log-files/list-log-files.controller'
import { ListLogsController } from './list-logs/list-logs.controller'

@Module({
  controllers: [
    CreateLogFileController,
    ListLogFilesController,
    GetLogFileByIdController,
    ListLogsController,
    GetLogEntryByIdController,
    DashboardController,
  ],
})
export class ControllersModule {}
