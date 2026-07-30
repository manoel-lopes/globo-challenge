import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { EnvModule } from '@/infra/env/env.module'
import { EnvService } from '@/infra/env/env.service'
import { BcryptPasswordHasher } from './implementations/bcrypt-password-hasher'
import { PasswordHasher } from './ports/password-hasher'

@Global()
@Module({
  imports: [
    EnvModule,
    JwtModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService) => ({
        secret: envService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [
    {
      provide: PasswordHasher,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [PasswordHasher, JwtModule],
})
export class SecurityModule {}
