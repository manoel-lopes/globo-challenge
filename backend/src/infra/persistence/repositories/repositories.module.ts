import { Global, Module } from '@nestjs/common'
import { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import { CacheModule } from '@/infra/cache/cache.module'
import { PrismaModule } from '@/infra/persistence/prisma.module'
import { CachedLogEntriesRepository } from './prisma/cached-log-entries.repository'
import { PrismaLogEntriesRepository } from './prisma/prisma-log-entries.repository'
import { PrismaLogFilesRepository } from './prisma/prisma-log-files.repository'

@Global()
@Module({
  imports: [CacheModule, PrismaModule],
  providers: [
    PrismaLogFilesRepository,
    {
      provide: LogFilesRepository,
      useClass: PrismaLogFilesRepository,
    },
    PrismaLogEntriesRepository,
    CachedLogEntriesRepository,
    {
      provide: LogEntriesRepository,
      useClass: CachedLogEntriesRepository,
    },
  ],
  exports: [LogFilesRepository, LogEntriesRepository],
})
export class RepositoriesModule {}
