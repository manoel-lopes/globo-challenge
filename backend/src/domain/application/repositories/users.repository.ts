import type { User, UserProps } from '@/domain/enterprise/entities/user.entity'

export type UsersRepository = {
  create(user: UserProps): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
}

export const UsersRepository = Symbol('UsersRepository')
