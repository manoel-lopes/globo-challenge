import type { UsersRepository } from '@/domain/application/repositories/users.repository'
import { PasswordHasherStub } from '@/infra/adapters/security/stubs/password-hasher.stub'
import { InMemoryUsersRepository } from '@/infra/persistence/repositories/in-memory/in-memory-users.repository'
import type { PasswordHasher } from '@/infra/adapters/security/ports/password-hasher'
import { CreateAccountUseCase } from './create-account.usecase'

describe('CreateAccountUseCase', () => {
  let sut: CreateAccountUseCase
  let usersRepository: UsersRepository
  let passwordHasherStub: PasswordHasher
  const request = {
    name: 'any_user_name',
    email: 'any_user_email',
    password: 'any_user_password',
  }

  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    passwordHasherStub = new PasswordHasherStub()
    sut = new CreateAccountUseCase(usersRepository, passwordHasherStub)
  })

  it('should not create a user account if the email is already registered', async () => {
    await sut.execute(request)

    await expect(sut.execute(request)).rejects.toThrow('User with email already registered')
  })

  it('should hash the password before storing', async () => {
    await sut.execute(request)

    const user = await usersRepository.findByEmail(request.email)
    expect(user?.password).toBe('hashed_any_user_password')
  })

  it('should correctly create a user account', async () => {
    await sut.execute(request)

    const user = await usersRepository.findByEmail(request.email)
    expect(user?.id).toBeDefined()
    expect(user?.name).toBe(request.name)
    expect(user?.email).toBe(request.email)
    expect(user?.password).toBeDefined()
    expect(user?.createdAt).toBeInstanceOf(Date)
    expect(user?.updatedAt).toBeInstanceOf(Date)
  })
})
