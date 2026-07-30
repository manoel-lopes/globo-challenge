import { Inject, Injectable } from '@nestjs/common'
import { UseCase } from '@/core/domain/application/use-case'
import { UsersRepository } from '@/domain/application/repositories/users.repository'
import { PasswordHasher } from '@/infra/adapters/security/ports/password-hasher'
import type { UserProps } from '@/domain/enterprise/entities/user.entity'
import { UserWithEmailAlreadyRegisteredError } from './errors/user-with-email-already-registered.error'

type CreateAccountRequest = UserProps

@Injectable()
export class CreateAccountUseCase implements UseCase {
  constructor (
    @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher
  ) {}

  async execute (req: CreateAccountRequest) {
    const { name, email, password } = req
    const userAlreadyExists = await this.usersRepository.findByEmail(email)
    if (userAlreadyExists) {
      throw new UserWithEmailAlreadyRegisteredError()
    }
    const hashedPassword = await this.passwordHasher.hash(password)
    await this.usersRepository.create({
      name,
      email,
      password: hashedPassword,
    })
  }
}
