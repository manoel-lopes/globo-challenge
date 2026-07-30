import { Global, Module } from '@nestjs/common'
import { RepositoriesModule } from '@/infra/persistence/repositories/repositories.module'
import { AuthenticateUserUseCase } from './authenticate-user/authenticate-user.usecase'
import { CreateAccountUseCase } from './create-account/create-account.usecase'

@Global()
@Module({
  imports: [RepositoriesModule],
  providers: [
    AuthenticateUserUseCase,
    CreateAccountUseCase,
  ],
  exports: [
    AuthenticateUserUseCase,
    CreateAccountUseCase,
  ],
})
export class UseCasesModule {}
