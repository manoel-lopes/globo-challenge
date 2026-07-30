import { Global, Module } from '@nestjs/common'
import { UsersRepository } from '@/domain/application/repositories/users.repository'
import { CacheModule } from '@/infra/cache/cache.module'
import { PrismaModule } from '@/infra/persistence/prisma.module'
import { PrismaUsersRepository } from './prisma/prisma-users.repository'

@Global()
@Module({
  imports: [CacheModule, PrismaModule],
  providers: [
    PrismaUsersRepository,
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [UsersRepository],
})
export class RepositoriesModule {}
