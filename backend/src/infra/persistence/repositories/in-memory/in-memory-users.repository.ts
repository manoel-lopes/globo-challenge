import type { UsersRepository } from '@/domain/application/repositories/users.repository'
import type { User } from '@/domain/enterprise/entities/user.entity'
import { BaseInMemoryRepository as BaseRepository } from './base/base-in-memory.repository'

export class InMemoryUsersRepository extends BaseRepository<User> implements UsersRepository {
  async findByEmail (email: string): Promise<User | null> {
    return this.findOneBy('email', email)
  }
}
