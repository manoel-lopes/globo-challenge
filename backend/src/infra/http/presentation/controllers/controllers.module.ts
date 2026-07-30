import { Module } from '@nestjs/common'
import { AuthenticateUserController } from './authenticate-user/authenticate-user.controller'
import { CreateAccountController } from './create-account/create-account.controller'

@Module({
  controllers: [
    AuthenticateUserController,
    CreateAccountController,
  ],
})
export class ControllersModule {}
