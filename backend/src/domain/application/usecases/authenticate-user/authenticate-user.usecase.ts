import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UseCase } from '@/core/domain/application/use-case'
import { UsersRepository } from '@/domain/application/repositories/users.repository'
import { PasswordHasher } from '@/infra/adapters/security/ports/password-hasher'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'
import { InvalidPasswordError } from './errors/invalid-password.error'

type AuthenticateUserRequest = {
  email: string
  password: string
}

export type AuthenticateUserResponse = {
  token: string
}

@Injectable()
export class AuthenticateUserUseCase implements UseCase {
  constructor (
    @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService
  ) {}

  async execute (req: AuthenticateUserRequest): Promise<AuthenticateUserResponse> {
    const { email, password } = req
    const user = await this.usersRepository.findByEmail(email)
    if (!user) {
      throw new ResourceNotFoundError('User')
    }
    const doesPasswordMatch = await this.passwordHasher.compare(password, user.password)
    if (!doesPasswordMatch) {
      throw new InvalidPasswordError()
    }
    const token = this.jwtService.sign({ sub: user.id })
    return { token }
  }
}
