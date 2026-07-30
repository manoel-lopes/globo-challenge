import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { UseCasesModule } from './domain/application/usecases/usecases.module'
import { SecurityModule } from './infra/adapters/security/security.module'
import { AuthModule } from './infra/auth/auth.module'
import { envSchema } from './infra/env/env'
import { EnvModule } from './infra/env/env.module'
import { ControllersModule } from './infra/http/presentation/controllers/controllers.module'
import { RepositoriesModule } from './infra/persistence/repositories/repositories.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    EnvModule,
    RepositoriesModule,
    SecurityModule,
    AuthModule,
    UseCasesModule,
    ControllersModule,
  ],
})
export class AppModule {}
