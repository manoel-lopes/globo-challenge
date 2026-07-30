import { JwtService } from '@nestjs/jwt'
import type { UsersRepository } from '@/domain/application/repositories/users.repository'
import type { PasswordHasher } from '@/infra/adapters/security/ports/password-hasher'
import { PasswordHasherStub } from '@/infra/adapters/security/stubs/password-hasher.stub'
import { InMemoryUsersRepository } from '@/infra/persistence/repositories/in-memory/in-memory-users.repository'
import { makeUserData } from '@tests/factories/domain/make-user'
import { AuthenticateUserUseCase } from './authenticate-user.usecase'

describe('AuthenticateUserUseCase', () => {
  let usersRepository: UsersRepository
  let passwordHasherStub: PasswordHasher
  let jwtService: JwtService
  let sut: AuthenticateUserUseCase

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    passwordHasherStub = new PasswordHasherStub()
    jwtService = Object.create(JwtService.prototype)
    jwtService.sign = vi.fn().mockReturnValue('mocked-jwt-token')
    sut = new AuthenticateUserUseCase(usersRepository, passwordHasherStub, jwtService)
  })

  it('should not authenticate an inexistent user', async () => {
    const request = {
      email: 'nonexistent@example.com',
      password: 'any-password',
    }

    await expect(sut.execute(request)).rejects.toThrow('User not found')
  })

  it('should not authenticate a user passing the wrong password', async () => {
    const email = 'user@example.com'
    await usersRepository.create({
      ...makeUserData({ email }),
      password: await passwordHasherStub.hash('correct-password'),
    })

    const request = {
      email,
      password: 'wrong-password',
    }

    await expect(sut.execute(request)).rejects.toThrow('Invalid password')
  })

  it('should authenticate the user and return a token', async () => {
    const password = 'user-password'
    const user = await usersRepository.create({
      ...makeUserData({ email: 'user@example.com' }),
      password: await passwordHasherStub.hash(password),
    })

    const request = {
      email: user.email,
      password,
    }

    const response = await sut.execute(request)

    expect(response.token).toBe('mocked-jwt-token')
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id })
  })
})
